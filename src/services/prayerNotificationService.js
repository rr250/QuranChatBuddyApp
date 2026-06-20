import { NotificationService } from "./notificationService";
import { PrayerService } from "./prayerService";
import { LocationService } from "./locationService";
import { VerseNotificationService } from "./verseNotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "./logger";
import { formatPrayerNotification } from "../constants/faithNotifications";

const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const buildPrayerSchedule = (prayerTimes) =>
    PRAYER_KEYS.map((name) => {
        const key = name.toLowerCase();
        const copy = formatPrayerNotification(name);
        return {
            name,
            time: prayerTimes[key],
            title: copy.title,
            body: copy.body,
        };
    });

export class PrayerNotificationService {
    static async initialize() {
        try {
            await this.setupDailyPrayerNotifications();
            logger.info("Prayer notification service initialized");
        } catch (error) {
            logger.error(
                "Prayer notification service initialization error:",
                error,
            );
        }
    }

    static async setupFaithReminders() {
        await Promise.all([
            this.setupDailyPrayerNotifications(),
            VerseNotificationService.setupDailyVerseNotifications(),
        ]);
    }

    static async setupDailyPrayerNotifications() {
        try {
            const notificationsEnabled = await this.areNotificationsEnabled();
            if (!notificationsEnabled) {
                logger.info("Prayer notifications are disabled");
                return;
            }

            await NotificationService.cancelPrayerNotifications();

            const location = await LocationService.getCurrentLocation({
                skipPermissionPrompt: true,
                allowFreshGps: false,
            });
            if (!location) {
                logger.info("Location not available for prayer notifications");
                return;
            }

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const prayerService = PrayerService.getInstance();

            const todayPrayers = prayerService.calculatePrayerTimes(
                location,
                today,
            );
            const tomorrowPrayers = prayerService.calculatePrayerTimes(
                location,
                tomorrow,
            );

            await this.scheduleTodayPrayerNotifications(todayPrayers);
            await this.scheduleTomorrowPrayerNotifications(tomorrowPrayers);

            const pending = await NotificationService.getPendingNotifications();
            logger.info(
                `Prayer notifications scheduled (${pending.length} total pending)`,
            );
        } catch (error) {
            logger.error("Error setting up prayer notifications:", error);
        }
    }

    static async scheduleTodayPrayerNotifications(prayerTimes) {
        const now = new Date();
        const prayers = buildPrayerSchedule(prayerTimes);

        for (const prayer of prayers) {
            if (prayer.time > now) {
                await NotificationService.schedulePrayerNotification(
                    prayer.name,
                    prayer.time,
                    prayer.title,
                    prayer.body,
                );
            }
        }
    }

    static async scheduleTomorrowPrayerNotifications(prayerTimes) {
        const prayers = buildPrayerSchedule(prayerTimes);

        for (const prayer of prayers) {
            await NotificationService.schedulePrayerNotification(
                prayer.name,
                prayer.time,
                prayer.title,
                prayer.body,
            );
        }
    }

    static async areNotificationsEnabled() {
        try {
            const [onboardingPref, prayerPref] = await Promise.all([
                AsyncStorage.getItem("notifications_enabled"),
                AsyncStorage.getItem("prayerNotificationsEnabled"),
            ]);
            if (onboardingPref === "false" || prayerPref === "false") {
                return false;
            }
            return onboardingPref === "true" || prayerPref === "true";
        } catch (error) {
            logger.error("Error checking notification settings:", error);
            return false;
        }
    }

    static async setPrayerNotifications(enabled) {
        try {
            await AsyncStorage.setItem(
                "prayerNotificationsEnabled",
                enabled.toString(),
            );

            if (enabled) {
                await this.setupFaithReminders();
            } else {
                const notifications =
                    await NotificationService.getPendingNotifications();
                const prayerNotifications = notifications.filter(
                    (n) =>
                        n.identifier.includes("prayer") ||
                        n.content?.data?.type === "prayer",
                );

                for (const notification of prayerNotifications) {
                    await NotificationService.cancelNotification(
                        notification.identifier,
                    );
                }
            }
        } catch (error) {
            logger.error("Error setting prayer notifications:", error);
        }
    }

    static async scheduleAdhanNotification(prayerName, prayerTime) {
        try {
            const copy = formatPrayerNotification(prayerName);
            await NotificationService.schedulePrayerNotification(
                `${prayerName}-adhan`,
                prayerTime,
                copy.title,
                copy.body,
            );
        } catch (error) {
            logger.error("Error scheduling Adhan notification:", error);
        }
    }
}
