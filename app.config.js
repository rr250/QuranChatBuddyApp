export default {
    expo: {
        name: "Quran Chat Buddy",
        slug: "quran-chat-buddy",
        scheme: "quranchatbuddy",
        version: "2.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "cover",
            backgroundColor: "#FFFFFF",
        },
        web: {
            favicon: "./assets/favicon.png",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.quranchatbuddy.meccatime",
            googleServicesFile:
                process.env.EXPO_PUBLIC_GOOGLE_SERVICES_INFO_PLIST ??
                "./GoogleService-Info.plist",
            infoPlist: {
                UIBackgroundModes: [
                    "background-fetch",
                    "remote-notification",
                    "fetch",
                ],
                ITSAppUsesNonExemptEncryption: false,
            },
        },
        android: {
            softwareKeyboardLayoutMode: "resize",
            adaptiveIcon: {
                foregroundImage: "./assets/icon.png",
                backgroundColor: "#FFFFFF",
            },
            package: "com.quranchatbuddy.meccatime",
            googleServicesFile:
                process.env.EXPO_PUBLIC_GOOGLE_SERVICES_JSON ??
                "./google-services.json",
            permissions: [
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_BACKGROUND_LOCATION",
                "android.permission.FOREGROUND_SERVICE",
                "android.permission.FOREGROUND_SERVICE_LOCATION",
                "android.permission.POST_NOTIFICATIONS",
                "android.permission.RECEIVE_BOOT_COMPLETED",
                "android.permission.USE_EXACT_ALARM",
                "android.permission.VIBRATE",
                "android.permission.WAKE_LOCK",
                "com.android.vending.BILLING",
            ],
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/splash.png",
                    resizeMode: "cover",
                    backgroundColor: "#FFFFFF",
                },
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/notification-icon.png",
                    color: "#0C3227",
                    defaultChannel: "default",
                },
            ],
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "Quran Chat Buddy uses your location to calculate accurate prayer times and Qibla direction.",
                    locationAlwaysPermission:
                        "Quran Chat Buddy needs background location access to send prayer time reminders.",
                    locationWhenInUsePermission:
                        "Quran Chat Buddy uses your location to calculate prayer times and Qibla direction.",
                    isAndroidBackgroundLocationEnabled: true,
                },
            ],
            "expo-apple-authentication",
            "expo-secure-store",
            [
                "react-native-android-widget",
                {
                    widgets: [
                        {
                            name: "PrayerTimes",
                            label: "Prayer Times",
                            description:
                                "Today's prayer times at a glance",
                            minWidth: "320dp",
                            minHeight: "110dp",
                            targetCellWidth: 4,
                            targetCellHeight: 2,
                            resizeMode: "horizontal|vertical",
                            previewImage: "./assets/icon.png",
                            updatePeriodMillis: 1800000,
                        },
                    ],
                },
            ],
        ],
        experiments: {
            typedRoutes: false,
        },
        extra: {
            router: {},
            eas: {
                projectId: "cab25cba-14da-478d-bb72-7d19e2fcea42",
            },
        },
        owner: "rrrishabh7",
    },
};
