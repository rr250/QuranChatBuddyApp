/** Placement names — must match Firebase Remote Config `ios_paywalls_config` */
export const PAYWALL_PLACEMENTS = {
    ONBOARDING: "Onboarding",
    PRAYER_COMPLETION: "Prayer_completion",
    DAILY_VERSE_CLICK: "Daily_verse_click",
    QUIZ_START: "Quiz_start",
    AMA_CLICK: "AMA_click",
    TODAYS_TOPIC_CLICK: "Todays_topic_click",
};

/** Firebase Remote Config parameter keys (existing console config) */
export const REMOTE_CONFIG_KEYS = {
    forceHardPaywall: "ios_force_hard_paywall",
    paywallsConfig: "ios_paywalls_config",
    quizAnimationSpeed: "ios_quiz_annimation_speed",
    suggestiveQuestions: "ios_ask_me_anything_suggestive_question",
    paywallAudioPath: "ios_paywall_audio_path",
    freeMessageCount: "ios_free_message_count",
    prayerDurations: "ios_prayer_namaz_durations",
    paywallCta: "ios_appopen_paywall_CTA",
    todayTopics: "ios_today_topic",
    revenueCatOfferingId: "ios_paywall_revenuecat_identifier_v1",
};

const DEFAULT_PAYWALLS = {
    paywalls: [
        {
            placement_name: PAYWALL_PLACEMENTS.ONBOARDING,
            paywall_name: "native",
            dismiss_enabled: true,
        },
        {
            placement_name: PAYWALL_PLACEMENTS.PRAYER_COMPLETION,
            paywall_name: "native",
            dismiss_enabled: true,
        },
        {
            placement_name: PAYWALL_PLACEMENTS.DAILY_VERSE_CLICK,
            paywall_name: "native",
            dismiss_enabled: true,
        },
        {
            placement_name: PAYWALL_PLACEMENTS.QUIZ_START,
            paywall_name: "native",
            dismiss_enabled: true,
        },
        {
            placement_name: PAYWALL_PLACEMENTS.AMA_CLICK,
            paywall_name: "native",
            dismiss_enabled: true,
        },
        {
            placement_name: PAYWALL_PLACEMENTS.TODAYS_TOPIC_CLICK,
            paywall_name: "native",
            dismiss_enabled: true,
        },
    ],
};

/** In-app defaults when Remote Config fetch fails — mirrors console v51 */
export const DEFAULT_REMOTE_CONFIG_VALUES = {
    [REMOTE_CONFIG_KEYS.forceHardPaywall]: "false",
    [REMOTE_CONFIG_KEYS.quizAnimationSpeed]: "2.0",
    [REMOTE_CONFIG_KEYS.paywallsConfig]: JSON.stringify(DEFAULT_PAYWALLS),
    [REMOTE_CONFIG_KEYS.suggestiveQuestions]: JSON.stringify({
        suggestive_question: [
            "How can I deepen my Iman?",
            "How Can I understand Quran better?",
        ],
    }),
    [REMOTE_CONFIG_KEYS.paywallAudioPath]: "Music/tabalagh_bil_qaleel.mp3",
    [REMOTE_CONFIG_KEYS.freeMessageCount]: "10",
    [REMOTE_CONFIG_KEYS.prayerDurations]: JSON.stringify({
        prayer_durations: {
            fajr: { min_seconds: 240, max_seconds: 420, rakats: "2 Sunnah + 2 Fard" },
            dhuhr: {
                min_seconds: 480,
                max_seconds: 720,
                rakats: "4 Sunnah + 4 Fard + 2 Sunnah",
            },
            asr: {
                min_seconds: 300,
                max_seconds: 480,
                rakats: "4 Fard (Sunnah optional)",
            },
            maghrib: {
                min_seconds: 240,
                max_seconds: 360,
                rakats: "3 Fard + 2 Sunnah",
            },
            isha: {
                min_seconds: 480,
                max_seconds: 720,
                rakats: "4 Fard + 2 Sunnah + 3 Witr",
            },
        },
    }),
    [REMOTE_CONFIG_KEYS.paywallCta]: JSON.stringify({
        trial_user: "Start Free Trial",
        non_trial_user: "Start Now",
    }),
    [REMOTE_CONFIG_KEYS.todayTopics]: JSON.stringify({
        todays_topics: { version: "1.0", updated_at: "2025-12-18", topics: [] },
    }),
    [REMOTE_CONFIG_KEYS.revenueCatOfferingId]: "premium-worldwide-a",
};
