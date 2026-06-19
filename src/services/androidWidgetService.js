import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { ANDROID_PRAYER_WIDGET_NAME } from "../constants/androidWidget";
import { loadPrayerWidgetData } from "../widgets/prayerTimesWidgetData";
import { buildPrayerTimesAndroidWidget } from "../widgets/PrayerTimesAndroidWidget";

export class AndroidWidgetService {
    static isSupported() {
        return Platform.OS === "android";
    }

    static async syncPrayerWidget() {
        if (!this.isSupported()) {
            return;
        }

        try {
            await requestWidgetUpdate({
                widgetName: ANDROID_PRAYER_WIDGET_NAME,
                renderWidget: async () => {
                    const data = await loadPrayerWidgetData();
                    return buildPrayerTimesAndroidWidget(data);
                },
                widgetNotFound: () => {},
            });
        } catch (error) {
            console.warn("Android widget sync failed:", error);
        }
    }
}
