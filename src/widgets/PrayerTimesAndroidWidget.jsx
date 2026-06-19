import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import {
    ANDROID_PRAYER_WIDGET_DEEP_LINK,
} from "../constants/androidWidget";

const ROOT_GRADIENT = {
    from: "#2E8B57",
    to: "#1B5E20",
    orientation: "TOP_BOTTOM",
};

export function buildPrayerTimesAndroidWidget(data) {
    if (data.loading) {
        return (
            <FlexWidget
                style={{
                    height: "match_parent",
                    width: "match_parent",
                    backgroundGradient: ROOT_GRADIENT,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 16,
                }}
                clickAction="OPEN_URI"
                clickActionData={{ uri: ANDROID_PRAYER_WIDGET_DEEP_LINK }}
            >
                <TextWidget
                    text="Loading prayer times..."
                    style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        textAlign: "center",
                    }}
                />
            </FlexWidget>
        );
    }

    return (
        <FlexWidget
            style={{
                height: "match_parent",
                width: "match_parent",
                backgroundGradient: ROOT_GRADIENT,
                padding: 12,
                clickAction: "OPEN_URI",
                clickActionData: { uri: ANDROID_PRAYER_WIDGET_DEEP_LINK },
            }}
        >
            <TextWidget
                text="Prayer Times"
                style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 8,
                }}
            />

            <FlexWidget
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flex: 1,
                    alignItems: "center",
                }}
            >
                {data.items.map((prayer) => (
                    <FlexWidget
                        key={prayer.key}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            paddingHorizontal: 2,
                        }}
                    >
                        <FlexWidget
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: prayer.isActive
                                    ? "#DAA520"
                                    : "rgba(255,255,255,0.15)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 4,
                            }}
                        >
                            <TextWidget
                                text={prayer.label.charAt(0)}
                                style={{
                                    color: "#FFFFFF",
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                }}
                            />
                        </FlexWidget>
                        <TextWidget
                            text={prayer.label}
                            style={{
                                color: "rgba(255,255,255,0.85)",
                                fontSize: 9,
                                textAlign: "center",
                                marginBottom: 2,
                            }}
                            maxLines={1}
                        />
                        <TextWidget
                            text={prayer.time}
                            style={{
                                color: prayer.isActive ? "#DAA520" : "#FFFFFF",
                                fontSize: 9,
                                fontWeight: prayer.isActive ? "bold" : "normal",
                                textAlign: "center",
                            }}
                            maxLines={1}
                        />
                    </FlexWidget>
                ))}
            </FlexWidget>

            {data.locationLabel ? (
                <TextWidget
                    text={data.locationLabel}
                    style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 8,
                        textAlign: "center",
                        marginTop: 6,
                    }}
                    maxLines={1}
                    truncate="END"
                />
            ) : null}

            {data.error ? (
                <TextWidget
                    text={data.error}
                    style={{
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 8,
                        textAlign: "center",
                        marginTop: 4,
                    }}
                    maxLines={1}
                />
            ) : null}
        </FlexWidget>
    );
}
