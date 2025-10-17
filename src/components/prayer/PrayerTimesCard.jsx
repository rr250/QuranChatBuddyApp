import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, ProgressBar, Chip, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PrayerService } from "../../services/prayerService";
import { LocationService } from "../../services/locationService";
import { theme } from "../../constants/theme";
import moment from "moment";

export const PrayerTimesCard = () => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [currentPrayer, setCurrentPrayer] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    const prayerService = PrayerService.getInstance();

    useEffect(() => {
        loadPrayerTimes();
        const interval = setInterval(updateNextPrayer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const loadPrayerTimes = async () => {
        try {
            setLoading(true);
            const currentLocation = await LocationService.getCurrentLocation();
            setLocation(currentLocation);

            const times = prayerService.calculatePrayerTimes(currentLocation);
            setPrayerTimes(times);

            updatePrayerState(times);
        } catch (error) {
            console.error("Error loading prayer times:", error);
        } finally {
            setLoading(false);
        }
    };

    const updatePrayerState = (times) => {
        const next = prayerService.getNextPrayer(times);
        const current = prayerService.getCurrentPrayer(times);

        setNextPrayer(next);
        setCurrentPrayer(current);
    };

    const updateNextPrayer = () => {
        if (prayerTimes) {
            updatePrayerState(prayerTimes);
        }
    };

    const getTimeUntilNext = () => {
        if (!nextPrayer) return "0m";
        return prayerService.getTimeUntilNextPrayer(nextPrayer);
    };

    const getPrayerProgress = () => {
        if (!prayerTimes || !nextPrayer) return 0;

        const now = new Date();
        const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
        const currentIndex = prayers.indexOf(nextPrayer.name.toLowerCase());

        if (currentIndex === 0) return 0; // Before Fajr

        const previousPrayerTime = prayerTimes[prayers[currentIndex - 1]];
        const nextPrayerTime = nextPrayer.timestamp;

        const totalDuration = nextPrayerTime - previousPrayerTime;
        const elapsed = now - previousPrayerTime;

        return Math.min(Math.max(elapsed / totalDuration, 0), 1);
    };

    if (loading) {
        return (
            <Card style={styles.card}>
                <Card.Content style={styles.loadingContent}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={32}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.loadingText}>
                        Loading prayer times...
                    </Text>
                </Card.Content>
            </Card>
        );
    }

    const allPrayers = [
        {
            name: "Fajr",
            time: prayerTimes.fajr,
            icon: "🌅",
            color: theme.colors.fajr,
        },
        {
            name: "Dhuhr",
            time: prayerTimes.dhuhr,
            icon: "☀️",
            color: theme.colors.dhuhr,
        },
        {
            name: "Asr",
            time: prayerTimes.asr,
            icon: "🌤️",
            color: theme.colors.asr,
        },
        {
            name: "Maghrib",
            time: prayerTimes.maghrib,
            icon: "🌆",
            color: theme.colors.maghrib,
        },
        {
            name: "Isha",
            time: prayerTimes.isha,
            icon: "🌙",
            color: theme.colors.isha,
        },
    ];

    return (
        <Card style={styles.card}>
            <Card.Content>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MaterialCommunityIcons
                            name="clock-outline"
                            size={24}
                            color={theme.colors.primary}
                        />
                        <Text style={styles.title}>Prayer Times</Text>
                    </View>
                    <IconButton
                        icon="chevron-right"
                        size={20}
                        onPress={() => router.push("/(tabs)/prayer")}
                    />
                </View>

                {/* Current Prayer Status */}
                {currentPrayer && (
                    <Chip
                        mode="outlined"
                        style={[
                            styles.currentPrayerChip,
                            { borderColor: theme.colors.primary },
                        ]}
                        textStyle={styles.currentPrayerText}
                    >
                        Current: {currentPrayer}
                    </Chip>
                )}

                {/* Next Prayer */}
                {nextPrayer && (
                    <View style={styles.nextPrayerContainer}>
                        <View style={styles.nextPrayerHeader}>
                            <Text style={styles.nextPrayerLabel}>
                                Next Prayer
                            </Text>
                            <Text style={styles.timeUntil}>
                                {getTimeUntilNext()}
                            </Text>
                        </View>

                        <View style={styles.nextPrayerInfo}>
                            <Text style={styles.nextPrayerIcon}>
                                {nextPrayer.icon}
                            </Text>
                            <View style={styles.nextPrayerDetails}>
                                <Text style={styles.nextPrayerName}>
                                    {nextPrayer.name}
                                </Text>
                                <Text style={styles.nextPrayerTime}>
                                    {nextPrayer.timeString}
                                    {nextPrayer.isTomorrow && (
                                        <Text style={styles.tomorrowLabel}>
                                            {" "}
                                            (Tomorrow)
                                        </Text>
                                    )}
                                </Text>
                            </View>
                        </View>

                        <ProgressBar
                            progress={getPrayerProgress()}
                            color={theme.colors.primary}
                            style={styles.progressBar}
                        />
                    </View>
                )}

                {/* All Prayer Times */}
                <View style={styles.prayersList}>
                    {allPrayers.map((prayer, index) => (
                        <View key={index} style={styles.prayerRow}>
                            <View style={styles.prayerInfo}>
                                <Text style={styles.prayerIcon}>
                                    {prayer.icon}
                                </Text>
                                <Text style={styles.prayerName}>
                                    {prayer.name}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.prayerTimeBadge,
                                    { backgroundColor: prayer.color + "15" },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.prayerTime,
                                        { color: prayer.color },
                                    ]}
                                >
                                    {prayerService.formatPrayerTime(
                                        prayer.time
                                    )}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Location */}
                {location && (
                    <View style={styles.locationContainer}>
                        <MaterialCommunityIcons
                            name="map-marker"
                            size={16}
                            color={theme.colors.onSurfaceVariant}
                        />
                        <Text style={styles.locationText}>
                            {location.city || "Unknown"},{" "}
                            {location.country || "Unknown"}
                        </Text>
                    </View>
                )}
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
        elevation: 2,
    },
    loadingContent: {
        alignItems: "center",
        paddingVertical: theme.spacing.xl,
    },
    loadingText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.onSurfaceVariant,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: theme.spacing.sm,
        color: theme.colors.onSurface,
    },
    currentPrayerChip: {
        alignSelf: "flex-start",
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.primary + "10",
    },
    currentPrayerText: {
        color: theme.colors.primary,
        fontWeight: "600",
    },
    nextPrayerContainer: {
        backgroundColor: theme.colors.primaryContainer + "20",
        padding: theme.spacing.md,
        borderRadius: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    nextPrayerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    nextPrayerLabel: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        fontWeight: "500",
    },
    timeUntil: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    nextPrayerInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    nextPrayerIcon: {
        fontSize: 28,
        marginRight: theme.spacing.md,
    },
    nextPrayerDetails: {
        flex: 1,
    },
    nextPrayerName: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    nextPrayerTime: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: "600",
    },
    tomorrowLabel: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        fontWeight: "400",
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
    },
    prayersList: {
        marginTop: theme.spacing.sm,
    },
    prayerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.spacing.sm,
        marginBottom: 2,
    },
    prayerInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    prayerIcon: {
        fontSize: 18,
        marginRight: theme.spacing.sm,
    },
    prayerName: {
        fontSize: 16,
        fontWeight: "500",
        color: theme.colors.onSurface,
    },
    prayerTimeBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.spacing.sm,
    },
    prayerTime: {
        fontSize: 14,
        fontWeight: "600",
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
    },
    locationText: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginLeft: theme.spacing.xs,
    },
});
