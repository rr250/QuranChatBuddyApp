import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

const { SchedulableTriggerInputTypes } = Notifications;
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirebaseDatabase } from "./firebase";
import { ref, update } from "firebase/database";
import { AuthService } from "./authService";
import logger from "./logger";

// Configure notifications with updated API
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export class NotificationService {
    static isExpoGo = Constants.appOwnership === "expo";

    static async initialize({ requestPermissions = false } = {}) {
        try {
            await this.setupNotificationChannels();
            this.setupNotificationListeners();

            if (requestPermissions) {
                await this.ensurePermissions();
            }
        } catch (error) {
            logger.error("Failed to initialize notifications:", error);
        }
    }

    static async requestNotificationPermissions() {
        try {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                    },
                });
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                return false;
            }

            return true;
        } catch (error) {
            logger.error("Error requesting notification permissions:", error);
            return false;
        }
    }

    static async ensurePermissions() {
        try {
            const granted = await this.requestNotificationPermissions();
            if (!granted) {
                return false;
            }

            if (!this.isExpoGo) {
                this.registerForPushNotifications().catch((error) => {
                    logger.warn(
                        "Push token registration failed (local notifications still work):",
                        error,
                    );
                });
            }

            return true;
        } catch (error) {
            logger.error("Failed to ensure notification permissions:", error);
            return false;
        }
    }

    static async registerForPushNotifications() {
        try {
            const projectId =
                Constants.expoConfig?.extra?.eas?.projectId ||
                Constants.expoConfig?.projectId ||
                Constants.manifest?.projectId;

            if (!projectId) {
                logger.warn("No project ID found for push notifications");
                return;
            }

            const token = (
                await Notifications.getExpoPushTokenAsync({ projectId })
            ).data;

            await this.savePushToken(token);
        } catch (error) {
            logger.error("Error registering for push notifications:", error);
        }
    }

    static async savePushToken(token) {
        try {
            await AsyncStorage.setItem("pushToken", token);

            AuthService.initialize();
            const userId = AuthService.getCurrentUser()?.uid;
            if (userId) {
                const database = getFirebaseDatabase();
                const userRef = ref(database, `users/${userId}`);
                await update(userRef, {
                    pushToken: token,
                    pushTokenUpdatedAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            logger.error("Error saving push token:", error);
        }
    }

    static async setupNotificationChannels() {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync(
                "prayer-reminders",
                {
                    name: "Prayer Reminders",
                    description: "Notifications for daily prayers",
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    sound: "default",
                },
            );

            await Notifications.setNotificationChannelAsync("faith-reminders", {
                name: "Faith Reminders",
                description: "Daily verse and spiritual reminders",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                sound: "default",
            });

            await Notifications.setNotificationChannelAsync(
                "local-notifications",
                {
                    name: "App Notifications",
                    description: "General app notifications",
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: "default",
                },
            );
        }
    }

    static setupNotificationListeners() {
        Notifications.addNotificationReceivedListener(() => {});

        Notifications.addNotificationResponseReceivedListener((response) => {
            this.handleNotificationTap(response);
        });
    }

    static handleNotificationTap(response) {
        const { data } = response.notification.request.content;
        logger.debug("Notification tapped:", data);
    }

    static async schedulePrayerNotification(
        prayerName,
        prayerTime,
        title,
        body,
    ) {
        try {
            const when = new Date(prayerTime);
            if (when <= new Date()) return null;

            const identifier = `prayer-${prayerName}-${when.toISOString().slice(0, 16)}`;

            const notificationId =
                await Notifications.scheduleNotificationAsync({
                    identifier,
                    content: {
                        title,
                        body,
                        sound: "default",
                        channelId: "prayer-reminders",
                        data: {
                            type: "prayer",
                            prayerName,
                            source: "local",
                        },
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DATE,
                        date: when,
                        channelId: "prayer-reminders",
                    },
                });

            return notificationId;
        } catch (error) {
            logger.error("Error scheduling local notification:", error);
            return null;
        }
    }

    static async scheduleVerseNotification(when, title, body) {
        try {
            const date = when instanceof Date ? when : new Date(when);
            if (date <= new Date()) return null;

            const identifier = `verse-daily-${date.toISOString().slice(0, 10)}`;

            const notificationId =
                await Notifications.scheduleNotificationAsync({
                    identifier,
                    content: {
                        title,
                        body,
                        sound: "default",
                        channelId: "faith-reminders",
                        data: {
                            type: "verse",
                            source: "local",
                        },
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DATE,
                        date,
                        channelId: "faith-reminders",
                    },
                });

            return notificationId;
        } catch (error) {
            logger.error("Error scheduling verse notification:", error);
            return null;
        }
    }

    static async sendLocalNotification(title, body, data = {}) {
        try {
            await Notifications.presentNotificationAsync({
                title,
                body,
                data: {
                    ...data,
                    source: "local",
                },
                sound: "default",
                ...(Platform.OS === "android"
                    ? { channelId: "local-notifications" }
                    : {}),
            });
        } catch (error) {
            logger.error("Error sending local notification:", error);
        }
    }

    static async sendTestNotification() {
        try {
            await this.sendLocalNotification(
                "🕌 Quran Chat Buddy",
                "Test notification from your Islamic companion!",
                { type: "test" },
            );
        } catch (error) {
            logger.error("Error sending test notification:", error);
        }
    }

    static async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            logger.error("Error cancelling notifications:", error);
        }
    }

    static async getPendingNotifications() {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            logger.error("Error getting pending notifications:", error);
            return [];
        }
    }

    static async cancelNotification(identifier) {
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
        } catch (error) {
            logger.error("Error cancelling notification:", error);
        }
    }

    static async cancelPrayerNotifications() {
        try {
            const pending = await this.getPendingNotifications();
            const prayerIds = pending
                .filter(
                    (n) =>
                        n.identifier?.startsWith("prayer-") ||
                        n.content?.data?.type === "prayer",
                )
                .map((n) => n.identifier);

            await Promise.all(
                prayerIds.map((id) => this.cancelNotification(id)),
            );
        } catch (error) {
            logger.error("Error cancelling prayer notifications:", error);
        }
    }

    static async cancelVerseNotifications() {
        try {
            const pending = await this.getPendingNotifications();
            const verseIds = pending
                .filter(
                    (n) =>
                        n.identifier?.startsWith("verse-") ||
                        n.content?.data?.type === "verse",
                )
                .map((n) => n.identifier);

            await Promise.all(
                verseIds.map((id) => this.cancelNotification(id)),
            );
        } catch (error) {
            logger.error("Error cancelling verse notifications:", error);
        }
    }

    static getNotificationStatus() {
        return {
            isExpoGo: this.isExpoGo,
            pushNotificationsSupported: !this.isExpoGo,
            localNotificationsSupported: true,
            recommendation: this.isExpoGo
                ? "Create development build for full notification support"
                : "All notification features available",
        };
    }
}
