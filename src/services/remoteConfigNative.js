import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { DEFAULT_REMOTE_CONFIG_VALUES } from "../constants/paywallConfig";

const STORAGE_PREFIX = "@qcb_remote_config/";
const INSTALLATION_KEY = `${STORAGE_PREFIX}installation`;
const CACHE_KEY = `${STORAGE_PREFIX}cache`;

const FIREBASE_SDK_VERSION = "12.4.0";
const INSTALLATIONS_SDK_VERSION = "w:0.6.18";

const getFirebaseClientConfig = () => ({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const encodeFid = (bytes) => {
    const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    let buffer = 0;
    let bits = 0;

    bytes.forEach((byte) => {
        buffer = (buffer << 8) | byte;
        bits += 8;
        while (bits >= 6) {
            bits -= 6;
            result += alphabet[(buffer >> bits) & 63];
        }
    });

    if (bits > 0) {
        result += alphabet[(buffer << (6 - bits)) & 63];
    }

    return result.slice(0, 22);
};

const generateFid = async () => {
    const bytes = await Crypto.getRandomBytesAsync(17);
    const fidBytes = Uint8Array.from(bytes);
    fidBytes[0] = 0b01110000 + (fidBytes[0] % 0b00010000);
    return encodeFid(fidBytes);
};

const getLanguageCode = () => {
    try {
        const locale =
            Intl.DateTimeFormat().resolvedOptions().locale ||
            Platform.select({ ios: "en-US", android: "en-US", default: "en-US" });
        return locale.replace("_", "-");
    } catch {
        return "en-US";
    }
};

const parseExpiresInMillis = (expiresIn) => {
    if (!expiresIn) return 0;
    const seconds = Number(String(expiresIn).replace(/s$/, ""));
    return Number.isFinite(seconds) ? seconds * 1000 : 0;
};

const readInstallation = async () => {
    const raw = await AsyncStorage.getItem(INSTALLATION_KEY);
    return raw ? JSON.parse(raw) : null;
};

const writeInstallation = async (installation) => {
    await AsyncStorage.setItem(INSTALLATION_KEY, JSON.stringify(installation));
};

const readCache = async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
};

const writeCache = async (cache) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const ensureInstallation = async ({ apiKey, projectId, appId }) => {
    let installation = await readInstallation();

    if (!installation?.fid) {
        installation = {
            fid: await generateFid(),
            refreshToken: null,
            authToken: null,
        };
    }

    const tokenExpired =
        !installation.authToken?.token ||
        Date.now() >= (installation.authToken?.expiresAtMillis ?? 0);

    if (tokenExpired) {
        if (!installation.refreshToken) {
            const response = await fetch(
                `https://firebaseinstallations.googleapis.com/v1/projects/${projectId}/installations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        fid: installation.fid,
                        appId,
                        authVersion: "FIS_v2",
                        sdkVersion: INSTALLATIONS_SDK_VERSION,
                    }),
                }
            );

            if (!response.ok) {
                const body = await response.text();
                throw new Error(
                    `Firebase Installations create failed (${response.status}): ${body}`
                );
            }

            const created = await response.json();
            installation = {
                fid: created.fid || installation.fid,
                refreshToken: created.refreshToken,
                authToken: {
                    token: created.authToken?.token,
                    expiresAtMillis:
                        Date.now() +
                        parseExpiresInMillis(created.authToken?.expiresIn),
                },
            };
        } else {
            const response = await fetch(
                `https://firebaseinstallations.googleapis.com/v1/projects/${projectId}/installations/${installation.fid}/authTokens:generate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                        Authorization: `FIS_v2 ${installation.refreshToken}`,
                    },
                    body: JSON.stringify({
                        installation: {
                            sdkVersion: INSTALLATIONS_SDK_VERSION,
                            appId,
                        },
                        forceRefresh: false,
                    }),
                }
            );

            if (!response.ok) {
                const body = await response.text();
                throw new Error(
                    `Firebase Installations token refresh failed (${response.status}): ${body}`
                );
            }

            const refreshed = await response.json();
            installation.authToken = {
                token: refreshed.token,
                expiresAtMillis:
                    Date.now() + parseExpiresInMillis(refreshed.expiresIn),
            };
        }

        await writeInstallation(installation);
    }

    return installation;
};

const fetchRemoteEntries = async () => {
    const { apiKey, projectId, appId } = getFirebaseClientConfig();
    if (!apiKey || !projectId || !appId) {
        throw new Error("Firebase client config is missing required env values");
    }

    const installation = await ensureInstallation({ apiKey, projectId, appId });
    const response = await fetch(
        `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/namespaces/firebase:fetch?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                appId,
                appInstanceId: installation.fid,
                appInstanceIdToken: installation.authToken.token,
                languageCode: getLanguageCode(),
                sdkVersion: FIREBASE_SDK_VERSION,
            }),
        }
    );

    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Firebase Remote Config fetch failed (${response.status}): ${body}`
        );
    }

    const payload = await response.json();
    return {
        entries: payload.entries ?? {},
        state: payload.state ?? "UPDATE",
        templateVersion: payload.templateVersion ?? null,
    };
};

export const createNativeRemoteConfigClient = () => {
    let entries = { ...DEFAULT_REMOTE_CONFIG_VALUES };
    let sources = Object.fromEntries(
        Object.keys(DEFAULT_REMOTE_CONFIG_VALUES).map((key) => [key, "default"])
    );
    let lastFetchStatus = "no-fetch-yet";
    let fetchTimeMillis = -1;
    let lastTemplateVersion = null;

    const applyEntries = (remoteEntries) => {
        const nextEntries = { ...DEFAULT_REMOTE_CONFIG_VALUES };
        const nextSources = { ...sources };

        Object.entries(remoteEntries ?? {}).forEach(([key, value]) => {
            nextEntries[key] = String(value);
            nextSources[key] = "remote";
        });

        entries = nextEntries;
        sources = nextSources;
    };

    const hydrateFromCache = async () => {
        const cache = await readCache();
        if (!cache?.entries) return false;

        applyEntries(cache.entries);
        fetchTimeMillis = cache.fetchTimeMillis ?? -1;
        lastFetchStatus = "success";
        lastTemplateVersion = cache.templateVersion ?? null;
        return true;
    };

    const fetchAndActivate = async (minimumFetchIntervalMillis) => {
        const now = Date.now();
        const cache = await readCache();
        const lastFetch = cache?.fetchTimeMillis ?? -1;
        const withinInterval =
            minimumFetchIntervalMillis > 0 &&
            lastFetch > 0 &&
            now - lastFetch < minimumFetchIntervalMillis;

        if (withinInterval) {
            if (cache?.entries) {
                applyEntries(cache.entries);
            }
            return false;
        }

        const { entries: remoteEntries, state, templateVersion } =
            await fetchRemoteEntries();
        const activated =
            state === "UPDATE" ||
            templateVersion !== lastTemplateVersion ||
            !cache?.entries;

        applyEntries(remoteEntries);
        fetchTimeMillis = now;
        lastFetchStatus = "success";
        lastTemplateVersion = templateVersion;

        await writeCache({
            entries: remoteEntries,
            fetchTimeMillis: now,
            templateVersion,
        });

        return activated;
    };

    return {
        async initialize(minimumFetchIntervalMillis) {
            await hydrateFromCache();
            return fetchAndActivate(minimumFetchIntervalMillis);
        },

        async refresh() {
            return fetchAndActivate(0);
        },

        getString(key) {
            return entries[key] ?? DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "";
        },

        getBoolean(key) {
            return this.getString(key) === "true";
        },

        getNumber(key) {
            return Number(this.getString(key) ?? 0);
        },

        getSources() {
            return { ...sources };
        },

        getStatus() {
            return {
                lastFetchStatus,
                fetchTimeMillis,
                lastTemplateVersion,
            };
        },
    };
};
