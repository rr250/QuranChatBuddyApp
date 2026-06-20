import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { ANDROID_PRAYER_WIDGET_DEEP_LINK } from "../constants/androidWidget";

const ROOT_GRADIENT = {
    from: "#2E8B57",
    to: "#1B5E20",
    orientation: "TOP_BOTTOM",
};

const ROOT_STYLE = {
    height: "match_parent",
    width: "match_parent",
    backgroundGradient: ROOT_GRADIENT,
    padding: 10,
    clickAction: "OPEN_URI",
    clickActionData: { uri: ANDROID_PRAYER_WIDGET_DEEP_LINK },
};

function PrayerColumn({ prayer }) {
    return (
        <FlexWidget
            style={{
                flex: 1,
                height: "match_parent",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: prayer.isActive
                    ? "rgba(218,165,32,0.22)"
                    : "rgba(255,255,255,0.08)",
                borderRadius: 8,
                paddingVertical: 4,
                paddingHorizontal: 2,
                marginHorizontal: 2,
            }}
        >
            <TextWidget
                text={prayer.label}
                style={{
                    color: prayer.isActive ? "#FFD54F" : "rgba(255,255,255,0.9)",
                    fontSize: 10,
                    fontWeight: prayer.isActive ? "bold" : "normal",
                    textAlign: "center",
                    marginBottom: 4,
                }}
                maxLines={1}
            />
            <TextWidget
                text={prayer.time}
                style={{
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: prayer.isActive ? "bold" : "normal",
                    textAlign: "center",
                }}
                maxLines={1}
            />
        </FlexWidget>
    );
}

export function buildPrayerTimesAndroidWidget(data) {
    if (data.loading) {
        return (
            <FlexWidget
                style={{
                    ...ROOT_STYLE,
                    justifyContent: "center",
                    alignItems: "center",
                }}
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
                ...ROOT_STYLE,
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "match_parent",
                    marginBottom: 6,
                }}
            >
                <TextWidget
                    text="Prayer Times"
                    style={{
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: "bold",
                    }}
                    maxLines={1}
                />
                {data.locationLabel ? (
                    <TextWidget
                        text={data.locationLabel}
                        style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: 9,
                            textAlign: "right",
                        }}
                        maxLines={1}
                        truncate="END"
                    />
                ) : null}
            </FlexWidget>

            <FlexWidget
                style={{
                    flexDirection: "row",
                    width: "match_parent",
                    height: "match_parent",
                    flex: 1,
                    alignItems: "stretch",
                }}
            >
                {data.items.map((prayer) => (
                    <PrayerColumn key={prayer.key} prayer={prayer} />
                ))}
            </FlexWidget>

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
