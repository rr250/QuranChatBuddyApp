import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassSurface } from "../ui/Glass";
import { theme } from "../../theme";
import {
    PRAYER_WIDGET_ITEMS,
    PRAYER_WIDGET_PREVIEW_TIMES,
} from "../../constants/faithNotifications";

const formatPrayerTime = (value) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const normalizePrayerKey = (name) =>
    typeof name === "string" ? name.toLowerCase() : "";

export const PrayerTimeWidget = ({
    prayerTimes = null,
    currentPrayer = null,
    nextPrayer = null,
    loading = false,
    preview = false,
    style,
}) => {
    const activeKey = useMemo(() => {
        if (preview) return "fajr";

        const current = normalizePrayerKey(
            typeof currentPrayer === "string"
                ? currentPrayer
                : currentPrayer?.name,
        );
        if (PRAYER_WIDGET_ITEMS.some((item) => item.key === current)) {
            return current;
        }

        const next = normalizePrayerKey(nextPrayer?.name);
        if (PRAYER_WIDGET_ITEMS.some((item) => item.key === next)) {
            return next;
        }

        return null;
    }, [currentPrayer, nextPrayer, preview]);

    return (
        <GlassSurface style={[styles.card, style]}>
            <Text style={styles.title}>Prayer Times</Text>
            <View style={styles.row}>
                {PRAYER_WIDGET_ITEMS.map((prayer) => {
                    const isActive = prayer.key === activeKey;
                    const time = preview
                        ? PRAYER_WIDGET_PREVIEW_TIMES[prayer.key]
                        : loading && !prayerTimes
                          ? "..."
                          : formatPrayerTime(prayerTimes?.[prayer.key]);

                    return (
                        <View key={prayer.key} style={styles.item}>
                            <View
                                style={[
                                    styles.iconWrap,
                                    isActive && styles.iconWrapActive,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={prayer.icon}
                                    size={18}
                                    color={
                                        isActive
                                            ? "#fff"
                                            : "rgba(255,255,255,0.85)"
                                    }
                                />
                            </View>
                            <Text style={styles.name}>{prayer.label}</Text>
                            <Text style={styles.time}>{time}</Text>
                        </View>
                    );
                })}
            </View>
        </GlassSurface>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: theme.spacing.md,
    },
    title: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: theme.spacing.md,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    item: {
        alignItems: "center",
        flex: 1,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        marginBottom: 6,
    },
    iconWrapActive: {
        backgroundColor: theme.colors.primary,
    },
    name: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 11,
        marginBottom: 2,
    },
    time: {
        color: "#fff",
        fontSize: 10,
        textAlign: "center",
    },
});
