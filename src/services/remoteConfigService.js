import { Platform } from "react-native";
import {
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    getAll,
    isSupported,
} from "firebase/remote-config";
import { getFirebaseApp } from "./firebase";
import { createNativeRemoteConfigClient } from "./remoteConfigNative";
import logger from "./logger";
import {
    DEFAULT_REMOTE_CONFIG_VALUES,
    REMOTE_CONFIG_KEYS,
} from "../constants/paywallConfig";

let remoteConfig = null;
let nativeClient = null;
let useWebSdk = Platform.OS === "web";
let initPromise = null;

const LOG_PREFIX = "[Remote Config]";

const getMinimumFetchInterval = () => {
    const fromEnv = process.env.EXPO_PUBLIC_REMOTE_CONFIG_FETCH_INTERVAL_MS;
    if (fromEnv && !Number.isNaN(Number(fromEnv))) {
        return Number(fromEnv);
    }
    return __DEV__ ? 0 : 3_600_000;
};

const readString = (key) => {
    if (nativeClient) {
        const value = nativeClient.getString(key);
        return value || (DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "");
    }
    if (!remoteConfig) return DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "";
    const value = getValue(remoteConfig, key).asString();
    return value || (DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "");
};

const readBoolean = (key) => {
    if (nativeClient) {
        return nativeClient.getBoolean(key);
    }
    if (!remoteConfig) {
        return DEFAULT_REMOTE_CONFIG_VALUES[key] === "true";
    }
    return getValue(remoteConfig, key).asBoolean();
};

const readNumber = (key) => {
    if (nativeClient) {
        return nativeClient.getNumber(key);
    }
    if (!remoteConfig) {
        return Number(DEFAULT_REMOTE_CONFIG_VALUES[key] ?? 0);
    }
    return getValue(remoteConfig, key).asNumber();
};

const parseJson = (key) => {
    try {
        const raw = readString(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const buildRawValues = () => ({
    forceHardPaywall: readBoolean("ios_force_hard_paywall"),
    quizAnimationSpeed: readNumber("ios_quiz_annimation_speed"),
    paywallsConfig: parseJson("ios_paywalls_config"),
    suggestiveQuestions: parseJson("ios_ask_me_anything_suggestive_question"),
    paywallAudioPath: readString("ios_paywall_audio_path"),
    freeMessageCount: readNumber("ios_free_message_count"),
    prayerDurations: parseJson("ios_prayer_namaz_durations"),
    paywallCta: parseJson("ios_appopen_paywall_CTA"),
    todayTopics: parseJson("ios_today_topic"),
    revenueCatOfferingId: readString("ios_paywall_revenuecat_identifier_v1"),
});

const getValueSources = () => {
    if (nativeClient) {
        return nativeClient.getSources();
    }
    if (!remoteConfig) {
        return Object.fromEntries(
            Object.values(REMOTE_CONFIG_KEYS).map((key) => [key, "default"]),
        );
    }

    const all = getAll(remoteConfig);
    return Object.fromEntries(
        Object.values(REMOTE_CONFIG_KEYS).map((key) => [
            key,
            all[key]?.getSource?.() ?? "default",
        ]),
    );
};

const logRemoteConfigStatus = (
    event,
    { activated = null, error = null } = {},
) => {
    const values = buildRawValues();
    const sources = getValueSources();
    const remoteKeyCount = Object.values(sources).filter(
        (source) => source === "remote",
    ).length;

    if (error) {
        logger.warn(`${LOG_PREFIX} ${event} failed:`, error);
        logger.warn(
            `${LOG_PREFIX} Using in-app defaults until Remote Config is available`,
        );
    } else {
        logger.info(`${LOG_PREFIX} ${event} succeeded`);
        const status = nativeClient
            ? nativeClient.getStatus()
            : remoteConfig
              ? {
                    lastFetchStatus: remoteConfig.lastFetchStatus,
                    fetchTimeMillis: remoteConfig.fetchTimeMillis,
                }
              : null;

        logger.info(`${LOG_PREFIX} Connection:`, {
            platform: Platform.OS,
            transport: useWebSdk ? "firebase-web-sdk" : "firebase-rest-api",
            ...status,
            activated,
            remoteValues: remoteKeyCount,
            totalKeys: Object.keys(sources).length,
        });
    }

    logger.info(`${LOG_PREFIX} Active values:`, values);
    logger.info(`${LOG_PREFIX} Value sources:`, sources);
};

const initializeWebRemoteConfig = async () => {
    const supported = await isSupported();
    if (!supported) {
        throw new Error(
            "Firebase web Remote Config is not supported in this environment",
        );
    }

    const app = getFirebaseApp();
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis =
        getMinimumFetchInterval();
    remoteConfig.defaultConfig = DEFAULT_REMOTE_CONFIG_VALUES;

    return fetchAndActivate(remoteConfig);
};

const initializeNativeRemoteConfig = async () => {
    nativeClient = createNativeRemoteConfigClient();
    return nativeClient.initialize(getMinimumFetchInterval());
};

export const RemoteConfigService = {
    async initialize() {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                if (Platform.OS === "web") {
                    useWebSdk = true;
                    const activated = await initializeWebRemoteConfig();
                    logRemoteConfigStatus("initialize", { activated });
                    return remoteConfig;
                }

                useWebSdk = false;
                const activated = await initializeNativeRemoteConfig();
                logRemoteConfigStatus("initialize", { activated });
                return nativeClient;
            } catch (error) {
                logRemoteConfigStatus("initialize", { error });
                return useWebSdk ? remoteConfig : nativeClient;
            }
        })();

        return initPromise;
    },

    async refresh() {
        await this.initialize();

        try {
            if (useWebSdk) {
                if (!remoteConfig) return false;
                const activated = await fetchAndActivate(remoteConfig);
                logRemoteConfigStatus("refresh", { activated });
                return true;
            }

            if (!nativeClient) return false;
            const activated = await nativeClient.refresh();
            logRemoteConfigStatus("refresh", { activated });
            return true;
        } catch (error) {
            logRemoteConfigStatus("refresh", { error });
            return false;
        }
    },

    getRawValues() {
        return buildRawValues();
    },
};
