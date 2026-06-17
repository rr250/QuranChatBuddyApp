import { RemoteConfigService } from "./remoteConfigService";

let cachedConfig = null;

const normalizeConfig = (raw) => {
    const paywalls = raw?.paywallsConfig?.paywalls ?? [];
    const paywallsByPlacement = {};
    paywalls.forEach((entry) => {
        if (entry?.placement_name) {
            paywallsByPlacement[entry.placement_name] = entry;
        }
    });

    return {
        forceHardPaywall: Boolean(raw?.forceHardPaywall),
        revenueCatOfferingId:
            raw?.revenueCatOfferingId?.trim() || "premium-worldwide-a",
        freeMessageCount: raw?.freeMessageCount ?? 10,
        quizAnimationSpeed: raw?.quizAnimationSpeed ?? 2,
        paywallAudioPath: raw?.paywallAudioPath ?? "",
        paywallCta: raw?.paywallCta ?? {
            trial_user: "Start Free Trial",
            non_trial_user: "Start Now",
        },
        suggestiveQuestions:
            raw?.suggestiveQuestions?.suggestive_question ?? [],
        todayTopics: raw?.todayTopics?.todays_topics ?? null,
        prayerDurations: raw?.prayerDurations?.prayer_durations ?? null,
        paywalls,
        paywallsByPlacement,
    };
};

export const PaywallConfigService = {
    async getConfig() {
        if (cachedConfig) return cachedConfig;

        await RemoteConfigService.initialize();
        cachedConfig = normalizeConfig(RemoteConfigService.getRawValues());
        return cachedConfig;
    },

    async refresh() {
        cachedConfig = null;
        await RemoteConfigService.refresh();
        return this.getConfig();
    },

    clearCache() {
        cachedConfig = null;
    },

    getPlacement(config, placementName) {
        return config?.paywallsByPlacement?.[placementName] ?? null;
    },

    isPlacementActive(config, placementName) {
        return Boolean(this.getPlacement(config, placementName));
    },

    getAllowClose(config, placement) {
        if (!placement) return true;
        if (config?.forceHardPaywall) return false;
        return Boolean(placement.dismiss_enabled);
    },
};
