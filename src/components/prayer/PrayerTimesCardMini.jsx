import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePrayerTimes } from "../../hooks/usePrayerTimes";
import { theme } from "../../constants/theme";
import { GlassDashboardCard } from "../ui/GlassDashboardCard";
import { glass } from "../../constants/glass";

export const PrayerTimesCardMini = () => {
    const { nextPrayer, currentPrayer, loading, getTimeUntilNext } = usePrayerTimes();

    if (loading) {
        return (
            <GlassDashboardCard onPress={() => router.push("/(tabs)/prayer")}>
                <View style={styles.loadingRow}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={22}
                        color="#fff"
                    />
                    <Text style={styles.loadingText}>Loading prayer times...</Text>
                </View>
            </GlassDashboardCard>
        );
    }

    return (
        <GlassDashboardCard onPress={() => router.push("/(tabs)/prayer")}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.title}>Prayer Times</Text>
                </View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                />
            </View>

            <View style={styles.prayerInfo}>
                <View style={styles.currentPrayer}>
                    <Text style={styles.label}>Current</Text>
                    <Text style={styles.prayerName}>{currentPrayer?.name ?? "—"}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.nextPrayer}>
                    <Text style={styles.label}>Next: {nextPrayer?.name}</Text>
                    <Text style={styles.time}>{getTimeUntilNext()}</Text>
                </View>
            </View>
        </GlassDashboardCard>
    );
};

const styles = StyleSheet.create({
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    loadingText: { color: "rgba(255,255,255,0.8)" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    prayerInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    currentPrayer: { flex: 1 },
    nextPrayer: { flex: 1, alignItems: "flex-end" },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: glass.borderSubtle,
        marginHorizontal: theme.spacing.md,
    },
    label: {
        fontSize: 12,
        color: "rgba(255,255,255,0.65)",
    },
    prayerName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    time: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.secondary,
    },
});
