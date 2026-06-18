import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationService } from "./notificationService";
import { getDailyVerse } from "../utils/dailyQuran";
import {
    DAILY_VERSE_NOTIFICATION_HOUR,
    DAILY_VERSE_NOTIFICATION_MINUTE,
    VERSE_NOTIFICATION_BODY,
    formatVerseNotificationTitle,
} from "../constants/faithNotifications";

export class VerseNotificationService {
    static async areNotificationsEnabled() {
        try {
            const [onboardingPref, versePref] = await Promise.all([
                AsyncStorage.getItem("notifications_enabled"),
                AsyncStorage.getItem("verseNotificationsEnabled"),
            ]);
            if (onboardingPref === "false" || versePref === "false") {
                return false;
            }
            return onboardingPref === "true" || versePref !== "false";
        } catch (error) {
            console.error("Error checking verse notification settings:", error);
            return false;
        }
    }

    static buildVerseNotificationTime(date = new Date()) {
        const when = new Date(date);
        when.setHours(
            DAILY_VERSE_NOTIFICATION_HOUR,
            DAILY_VERSE_NOTIFICATION_MINUTE,
            0,
            0,
        );
        return when;
    }

    static async setupDailyVerseNotifications() {
        try {
            const enabled = await this.areNotificationsEnabled();
            if (!enabled) {
                console.log("Verse notifications are disabled");
                return;
            }

            await NotificationService.cancelVerseNotifications();

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            await this.scheduleVerseNotificationForDate(today);
            await this.scheduleVerseNotificationForDate(tomorrow);
        } catch (error) {
            console.error("Error setting up verse notifications:", error);
        }
    }

    static async scheduleVerseNotificationForDate(date) {
        const when = this.buildVerseNotificationTime(date);
        if (when <= new Date()) return null;

        const verse = getDailyVerse(0, date);
        return NotificationService.scheduleVerseNotification(
            when,
            formatVerseNotificationTitle(verse),
            VERSE_NOTIFICATION_BODY,
        );
    }

    static async setVerseNotifications(enabled) {
        try {
            await AsyncStorage.setItem(
                "verseNotificationsEnabled",
                enabled.toString(),
            );

            if (enabled) {
                await this.setupDailyVerseNotifications();
            } else {
                await NotificationService.cancelVerseNotifications();
            }
        } catch (error) {
            console.error("Error setting verse notifications:", error);
        }
    }
}
