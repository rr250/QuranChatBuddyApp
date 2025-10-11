import { NotificationService } from "./notificationService";
import { PrayerService } from "./prayerService";
import { LocationService } from "./locationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class PrayerNotificationService {
    static async initialize() {
        try {
            await this.setupDailyPrayerNotifications();
            console.log("Prayer notification service initialized");
        } catch (error) {
            console.error(
                "Prayer notification service initialization error:",
                error
            );
        }
    }

    static async setupDailyPrayerNotifications() {
        try {
            // Get user's notification preferences
            const notificationsEnabled = await this.areNotificationsEnabled();
            if (!notificationsEnabled) {
                console.log("Prayer notifications are disabled");
                return;
            }

            // Get user's location
            const location = await LocationService.getCurrentLocation();
            if (!location) {
                console.log("Location not available for prayer notifications");
                return;
            }

            // Calculate prayer times for today and tomorrow
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Calculate prayer times for today and tomorrow
            const prayerService = PrayerService.getInstance();

            const todayPrayers = prayerService.calculatePrayerTimes(
                location,
                today
            );
            const tomorrowPrayers = prayerService.calculatePrayerTimes(
                location,
                tomorrow
            );

            // Schedule notifications for remaining prayers today
            await this.scheduleTodayPrayerNotifications(todayPrayers);

            // Schedule notifications for tomorrow
            await this.scheduleTomorrowPrayerNotifications(tomorrowPrayers);
        } catch (error) {
            console.error("Error setting up prayer notifications:", error);
        }
    }

    static async scheduleTodayPrayerNotifications(prayerTimes) {
        const now = new Date();
        const prayers = [
            {
                name: "Fajr",
                time: prayerTimes.fajr,
                title: "🌅 Fajr Prayer Time",
                body: "It's time for Fajr prayer. Start your day with remembrance of Allah.",
            },
            {
                name: "Dhuhr",
                time: prayerTimes.dhuhr,
                title: "☀️ Dhuhr Prayer Time",
                body: "It's time for Dhuhr prayer. Take a break and remember Allah.",
            },
            {
                name: "Asr",
                time: prayerTimes.asr,
                title: "🌤️ Asr Prayer Time",
                body: "It's time for Asr prayer. Afternoon remembrance of Allah.",
            },
            {
                name: "Maghrib",
                time: prayerTimes.maghrib,
                title: "🌆 Maghrib Prayer Time",
                body: "It's time for Maghrib prayer. End your day with gratitude to Allah.",
            },
            {
                name: "Isha",
                time: prayerTimes.isha,
                title: "🌙 Isha Prayer Time",
                body: "It's time for Isha prayer. Complete your day with worship.",
            },
        ];

        for (const prayer of prayers) {
            // Only schedule if prayer time hasn't passed
            if (prayer.time > now) {
                await NotificationService.schedulePrayerNotification(
                    prayer.name,
                    prayer.time,
                    prayer.title,
                    prayer.body
                );

                // Schedule reminder 10 minutes before
                const reminderTime = new Date(
                    prayer.time.getTime() - 10 * 60 * 1000
                );
                if (reminderTime > now) {
                    await NotificationService.schedulePrayerNotification(
                        `${prayer.name}-reminder`,
                        reminderTime,
                        `⏰ ${prayer.name} in 10 minutes`,
                        `${prayer.name} prayer time is approaching. Prepare for prayer.`
                    );
                }
            }
        }
    }

    static async scheduleTomorrowPrayerNotifications(prayerTimes) {
        const prayers = [
            {
                name: "Fajr",
                time: prayerTimes.fajr,
                title: "🌅 Fajr Prayer Time",
                body: "It's time for Fajr prayer. Start your day with remembrance of Allah.",
            },
            {
                name: "Dhuhr",
                time: prayerTimes.dhuhr,
                title: "☀️ Dhuhr Prayer Time",
                body: "It's time for Dhuhr prayer. Take a break and remember Allah.",
            },
            {
                name: "Asr",
                time: prayerTimes.asr,
                title: "🌤️ Asr Prayer Time",
                body: "It's time for Asr prayer. Afternoon remembrance of Allah.",
            },
            {
                name: "Maghrib",
                time: prayerTimes.maghrib,
                title: "🌆 Maghrib Prayer Time",
                body: "It's time for Maghrib prayer. End your day with gratitude to Allah.",
            },
            {
                name: "Isha",
                time: prayerTimes.isha,
                title: "🌙 Isha Prayer Time",
                body: "It's time for Isha prayer. Complete your day with worship.",
            },
        ];

        for (const prayer of prayers) {
            await NotificationService.schedulePrayerNotification(
                prayer.name,
                prayer.time,
                prayer.title,
                prayer.body
            );

            // Schedule reminder 10 minutes before
            const reminderTime = new Date(
                prayer.time.getTime() - 10 * 60 * 1000
            );
            await NotificationService.schedulePrayerNotification(
                `${prayer.name}-reminder`,
                reminderTime,
                `⏰ ${prayer.name} in 10 minutes`,
                `${prayer.name} prayer time is approaching. Prepare for prayer.`
            );
        }
    }

    static async areNotificationsEnabled() {
        try {
            const enabled = await AsyncStorage.getItem(
                "prayerNotificationsEnabled"
            );
            return enabled !== "false"; // Default to true if not set
        } catch (error) {
            console.error("Error checking notification settings:", error);
            return true;
        }
    }

    static async setPrayerNotifications(enabled) {
        try {
            await AsyncStorage.setItem(
                "prayerNotificationsEnabled",
                enabled.toString()
            );

            if (enabled) {
                await this.setupDailyPrayerNotifications();
            } else {
                // Cancel all prayer notifications
                const notifications =
                    await NotificationService.getPendingNotifications();
                const prayerNotifications = notifications.filter(
                    (n) =>
                        n.identifier.includes("prayer") ||
                        n.content?.data?.type === "prayer"
                );

                for (const notification of prayerNotifications) {
                    await NotificationService.cancelNotification(
                        notification.identifier
                    );
                }
            }
        } catch (error) {
            console.error("Error setting prayer notifications:", error);
        }
    }

    static async scheduleAdhanNotification(prayerName, prayerTime) {
        try {
            // Schedule Adhan notification (call to prayer)
            await NotificationService.schedulePrayerNotification(
                `${prayerName}-adhan`,
                prayerTime,
                `🕌 ${prayerName} Adhan`,
                `Allahu Akbar! It's time for ${prayerName} prayer.`
            );
        } catch (error) {
            console.error("Error scheduling Adhan notification:", error);
        }
    }
}
