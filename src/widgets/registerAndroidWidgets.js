import { Platform } from "react-native";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { ANDROID_PRAYER_WIDGET_NAME } from "../constants/androidWidget";
import { loadPrayerWidgetData } from "./prayerTimesWidgetData";
import { buildPrayerTimesAndroidWidget } from "./PrayerTimesAndroidWidget";

async function renderPrayerTimesWidget(renderWidget) {
    const data = await loadPrayerWidgetData();
    renderWidget(buildPrayerTimesAndroidWidget(data));
}

if (Platform.OS === "android") {
    registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
        if (widgetInfo.widgetName !== ANDROID_PRAYER_WIDGET_NAME) {
            return;
        }

        switch (widgetAction) {
            case "WIDGET_ADDED":
            case "WIDGET_UPDATE":
            case "WIDGET_RESIZED":
                await renderPrayerTimesWidget(renderWidget);
                break;
            default:
                break;
        }
    });
}
