import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirebaseDatabase } from "./firebase";
import { ref, update } from "firebase/database";

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

    static async initialize() {
        try {
            console.log("Initializing notification service...");
            console.log("Running in Expo Go:", this.isExpoGo);

            if (this.isExpoGo) {
                console.log(
                    "🚨 EXPO GO LIMITATION: Push notifications are not fully supported"
                );
                console.log(
                    "📱 For full notification support, create a development build"
                );
                await this.setupLocalNotifications();
            } else {
                await this.registerForPushNotifications();
            }

            await this.setupNotificationChannels();
            this.setupNotificationListeners();

            console.log("Notification service initialized");
        } catch (error) {
            console.error("Failed to initialize notifications:", error);
        }
    }

    static async setupLocalNotifications() {
        try {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } =
                    await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.log("Local notification permissions denied");
                return;
            }

            console.log("✅ Local notifications permissions granted");
        } catch (error) {
            console.error("Error setting up local notifications:", error);
        }
    }

    static async registerForPushNotifications() {
        try {
            const { status: existingStatus } =
                await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } =
                    await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.log("Push notification permissions denied");
                return;
            }

            const projectId =
                Constants.expoConfig?.projectId ||
                Constants.manifest?.projectId;

            if (!projectId) {
                console.error("No project ID found for push notifications");
                return;
            }

            const token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })
            ).data;

            console.log("Push token:", token);
            await this.savePushToken(token);
            return token;
        } catch (error) {
            console.error("Error registering for push notifications:", error);
        }
    }

    static async savePushToken(token) {
        try {
            // Save to local storage
            await AsyncStorage.setItem("pushToken", token);

            // Save to Realtime Database (if user is logged in)
            const userId = await AsyncStorage.getItem("userId");
            if (userId) {
                const database = getFirebaseDatabase();
                const userRef = ref(database, `users/${userId}`);
                await update(userRef, {
                    pushToken: token,
                    pushTokenUpdatedAt: new Date().toISOString(),
                });
            }

            console.log("Push token saved to Realtime Database");
        } catch (error) {
            console.error("Error saving push token:", error);
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
                }
            );

            await Notifications.setNotificationChannelAsync(
                "local-notifications",
                {
                    name: "App Notifications",
                    description: "General app notifications",
                    importance: Notifications.AndroidImportance.DEFAULT,
                    sound: "default",
                }
            );
        }
    }

    static setupNotificationListeners() {
        Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
        });

        Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("Notification tapped:", response);
            this.handleNotificationTap(response);
        });
    }

    static handleNotificationTap(response) {
        const { data } = response.notification.request.content;
        console.log("Notification data:", data);
    }

    // Schedule LOCAL prayer notifications
    static async schedulePrayerNotification(
        prayerName,
        prayerTime,
        title,
        body
    ) {
        try {
            const notificationId =
                await Notifications.scheduleNotificationAsync({
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
                        date: new Date(prayerTime),
                    },
                });

            console.log(
                `✅ Scheduled local notification for \${prayerName} at \${prayerTime}`
            );
            return notificationId;
        } catch (error) {
            console.error("Error scheduling local notification:", error);
        }
    }

    // Send immediate local notification
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
            });

            console.log("✅ Local notification sent:", title);
        } catch (error) {
            console.error("Error sending local notification:", error);
        }
    }

    // Test notification
    static async sendTestNotification() {
        try {
            await this.sendLocalNotification(
                "🕌 Quran Chat Buddy",
                "Test notification from your Islamic companion!",
                { type: "test" }
            );
        } catch (error) {
            console.error("Error sending test notification:", error);
        }
    }

    static async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log("All notifications cancelled");
        } catch (error) {
            console.error("Error cancelling notifications:", error);
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
