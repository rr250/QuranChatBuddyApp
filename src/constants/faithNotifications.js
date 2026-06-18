import { getLocalChapter } from "../data/quranLocal";

/** Prayer widget row config — shared by onboarding preview and home widget */
export const PRAYER_WIDGET_ITEMS = [
    { key: "fajr", label: "Fajr", icon: "weather-sunset-up" },
    { key: "dhuhr", label: "Dhuhr", icon: "white-balance-sunny" },
    { key: "asr", label: "Asr", icon: "weather-sunny" },
    { key: "maghrib", label: "Maghrib", icon: "weather-sunset" },
    { key: "isha", label: "Isha", icon: "weather-night" },
];

/** Static preview times for onboarding when live times are unavailable */
export const PRAYER_WIDGET_PREVIEW_TIMES = {
    fajr: "05:07 AM",
    dhuhr: "12:20 PM",
    asr: "03:40 PM",
    maghrib: "06:18 PM",
    isha: "07:37 PM",
};

export const VERSE_NOTIFICATION_BODY = "Take a moment for your faith";

export const formatPrayerNotification = (prayerName) => ({
    title: `${prayerName} Prayer`,
    body: `It's time to pray ${prayerName}!`,
});

export const formatVerseNotificationTitle = (verse) => {
    if (!verse) return "Today's Verse";
    const chapter = getLocalChapter(verse.surah);
    const surahName = chapter?.transliteration ?? `Surah ${verse.surah}`;
    return `Today's Verse: ${surahName} ${verse.surah}:${verse.ayah}`;
};

/** Example previews shown on the permissions screen */
export const FAITH_REMINDER_PREVIEWS = [
    {
        title: "Today's Verse: Al-Baqarah 2:2",
        body: VERSE_NOTIFICATION_BODY,
    },
    {
        title: "Asr Prayer",
        body: formatPrayerNotification("Asr").body,
    },
];

/** Default local time for the daily verse reminder */
export const DAILY_VERSE_NOTIFICATION_HOUR = 9;
export const DAILY_VERSE_NOTIFICATION_MINUTE = 0;
