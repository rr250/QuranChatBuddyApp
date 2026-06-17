import {
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    setDefaults,
} from "firebase/remote-config";
import { getFirebaseApp } from "./firebase";
import {
    DEFAULT_REMOTE_CONFIG_VALUES,
} from "../constants/paywallConfig";

let remoteConfig = null;
let initPromise = null;

const getMinimumFetchInterval = () => {
    const fromEnv = process.env.EXPO_PUBLIC_REMOTE_CONFIG_FETCH_INTERVAL_MS;
    if (fromEnv && !Number.isNaN(Number(fromEnv))) {
        return Number(fromEnv);
    }
    return __DEV__ ? 0 : 3_600_000;
};

const readString = (key) => {
    if (!remoteConfig) return DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "";
    const value = getValue(remoteConfig, key).asString();
    return value || (DEFAULT_REMOTE_CONFIG_VALUES[key] ?? "");
};

const readBoolean = (key) => {
    if (!remoteConfig) {
        return DEFAULT_REMOTE_CONFIG_VALUES[key] === "true";
    }
    return getValue(remoteConfig, key).asBoolean();
};

const readNumber = (key) => {
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

export const RemoteConfigService = {
    async initialize() {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                const app = getFirebaseApp();
                remoteConfig = getRemoteConfig(app);
                remoteConfig.settings.minimumFetchIntervalMillis =
                    getMinimumFetchInterval();

                await setDefaults(remoteConfig, DEFAULT_REMOTE_CONFIG_VALUES);
                await fetchAndActivate(remoteConfig);
            } catch (error) {
                console.warn("Firebase Remote Config init failed:", error);
            }
            return remoteConfig;
        })();

        return initPromise;
    },

    async refresh() {
        await this.initialize();
        if (!remoteConfig) return false;

        try {
            await fetchAndActivate(remoteConfig);
            return true;
        } catch (error) {
            console.warn("Firebase Remote Config refresh failed:", error);
            return false;
        }
    },

    getRawValues() {
        return {
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
        };
    },
};
