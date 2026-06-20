import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import {
    ScreenShell,
    screenContentPadding,
} from "../../src/components/navigation/ScreenShell";
import { GlassSurface } from "../../src/components/ui/Glass";
import { Text, ProgressBar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PrayerService } from "../../src/services/prayerService";
import { PrayerNotificationService } from "../../src/services/prayerNotificationService";
import { usePrayerTimes } from "../../src/hooks/usePrayerTimes";
import { theme, glass } from "../../src/theme";
import { Magnetometer } from "expo-sensors";
import logger from "../../src/services/logger";

const { width } = Dimensions.get("window");

export default function PrayerScreen() {
    const {
        prayerTimes,
        nextPrayer,
        currentPrayer,
        location,
        loading,
        refreshing,
        loadPrayerTimes,
        getTimeUntilNext,
        getPrayerProgress,
    } = usePrayerTimes();
    const [showQibla, setShowQibla] = useState(true);
    const lastScheduledDayRef = React.useRef(null);

    // Qibla compass state
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    const prayerService = PrayerService.getInstance();

    useEffect(() => {
        if (location) {
            calculateQiblaDirection(location);
        }
    }, [location]);

    useEffect(() => {
        if (!prayerTimes) return;

        const scheduleKey = new Date().toISOString().slice(0, 10);
        if (lastScheduledDayRef.current === scheduleKey) return;

        lastScheduledDayRef.current = scheduleKey;
        PrayerNotificationService.setupFaithReminders().catch((err) =>
            logger.warn("Prayer notification schedule failed:", err),
        );
    }, [prayerTimes]);

    // Qibla compass magnetometer
    useEffect(() => {
        let subscription;
        if (showQibla) {
            subscription = Magnetometer.addListener((data) => {
                let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
                angle = angle < 0 ? angle + 360 : angle;
                setHeading(angle);
            });
            Magnetometer.setUpdateInterval(100);
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [showQibla]);

    // Animate compass rotation
    useEffect(() => {
        if (showQibla) {
            Animated.timing(rotateAnim, {
                toValue: heading,
                duration: 100,
                useNativeDriver: true,
            }).start();
        }
    }, [heading, showQibla]);

    const calculateQiblaDirection = (loc) => {
        // Kaaba coordinates
        const kaabaLat = 21.4225;
        const kaabaLng = 39.8262;

        const lat1 = (loc.latitude * Math.PI) / 180;
        const lat2 = (kaabaLat * Math.PI) / 180;
        const deltaLng = ((kaabaLng - loc.longitude) * Math.PI) / 180;

        const y = Math.sin(deltaLng);
        const x =
            Math.cos(lat1) * Math.tan(lat2) -
            Math.sin(lat1) * Math.cos(deltaLng);

        let qibla = (Math.atan2(y, x) * 180) / Math.PI;
        qibla = (qibla + 360) % 360;

        setQiblaDirection(qibla);
    };

    const currentPrayerLabel =
        typeof currentPrayer === "string"
            ? currentPrayer
            : (currentPrayer?.name ?? "—");

    const allPrayers = prayerTimes
        ? [
              {
                  name: "Fajr",
                  time: prayerTimes.fajr,
                  icon: "🌅",
                  color: theme.colors.fajr || "#FF6B6B",
              },
              {
                  name: "Dhuhr",
                  time: prayerTimes.dhuhr,
                  icon: "☀️",
                  color: theme.colors.dhuhr || "#FFD93D",
              },
              {
                  name: "Asr",
                  time: prayerTimes.asr,
                  icon: "🌤️",
                  color: theme.colors.asr || "#FFA500",
              },
              {
                  name: "Maghrib",
                  time: prayerTimes.maghrib,
                  icon: "🌆",
                  color: theme.colors.maghrib || "#9B59B6",
              },
              {
                  name: "Isha",
                  time: prayerTimes.isha,
                  icon: "🌙",
                  color: theme.colors.isha || "#34495E",
              },
          ]
        : [];

    if (loading && !prayerTimes) {
        return (
            <ScreenShell title="Prayer Times" subtitle="Loading schedule...">
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={48}
                        color="#fff"
                    />
                    <Text style={styles.loadingText}>
                        Loading prayer times...
                    </Text>
                </View>
            </ScreenShell>
        );
    }

    return (
        <ScreenShell
            title="Prayer Times"
            subtitle={
                location?.city ? `${location.city}` : "Salah schedule & Qibla"
            }
            rightAction={
                <TouchableOpacity
                    onPress={loadPrayerTimes}
                    disabled={refreshing}
                    style={styles.refreshButton}
                >
                    <MaterialCommunityIcons
                        name="refresh"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>
            }
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={screenContentPadding}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={loadPrayerTimes}
                        tintColor="#fff"
                    />
                }
            >
                {/* Header */}
                {/* <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color={theme.colors.onSurface}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Prayer Times</Text>
                    <TouchableOpacity
                        onPress={() => setShowQibla(!showQibla)}
                        style={styles.qiblaButton}
                    >
                        <MaterialCommunityIcons
                            name="compass"
                            size={24}
                            color={
                                showQibla
                                    ? theme.colors.primary
                                    : theme.colors.onSurface
                            }
                        />
                    </TouchableOpacity>
                </View> */}

                {/* Qibla Compass */}
                {showQibla && (
                    <GlassSurface style={styles.qiblaCard}>
                        <View style={[styles.cardContent, styles.qiblaContent]}>
                            <Text style={styles.qiblaTitle}>
                                Qibla Direction
                            </Text>
                            <Text style={styles.qiblaSubtitle}>
                                Point your phone towards the Kaaba
                            </Text>

                            <View style={styles.compassContainer}>
                                {/* Compass Circle */}
                                <Animated.View
                                    style={[
                                        styles.compassCircle,
                                        {
                                            transform: [
                                                {
                                                    rotate: rotateAnim.interpolate(
                                                        {
                                                            inputRange: [
                                                                0, 360,
                                                            ],
                                                            outputRange: [
                                                                "0deg",
                                                                "360deg",
                                                            ],
                                                        },
                                                    ),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    {/* Cardinal directions */}
                                    <View style={styles.cardinalMarker}>
                                        <Text style={styles.cardinalText}>
                                            N
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.cardinalMarker,
                                            {
                                                transform: [
                                                    { rotate: "90deg" },
                                                ],
                                            },
                                        ]}
                                    >
                                        <Text style={styles.cardinalText}>
                                            E
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.cardinalMarker,
                                            {
                                                transform: [
                                                    { rotate: "180deg" },
                                                ],
                                            },
                                        ]}
                                    >
                                        <Text style={styles.cardinalText}>
                                            S
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.cardinalMarker,
                                            {
                                                transform: [
                                                    { rotate: "270deg" },
                                                ],
                                            },
                                        ]}
                                    >
                                        <Text style={styles.cardinalText}>
                                            W
                                        </Text>
                                    </View>

                                    {/* Compass ticks */}
                                    {[...Array(36)].map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.compassTick,
                                                {
                                                    transform: [
                                                        {
                                                            rotate: `${
                                                                index * 10
                                                            }deg`,
                                                        },
                                                    ],
                                                },
                                                index % 9 === 0 &&
                                                    styles.compassTickMajor,
                                            ]}
                                        />
                                    ))}
                                </Animated.View>

                                {/* Qibla Arrow */}
                                <View
                                    style={[
                                        styles.qiblaArrow,
                                        {
                                            transform: [
                                                {
                                                    rotate: `${
                                                        qiblaDirection - heading
                                                    }deg`,
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name="navigation"
                                        size={60}
                                        color={theme.colors.secondary}
                                    />
                                </View>

                                {/* Center Dot */}
                                <View style={styles.compassCenter} />
                            </View>

                            <Text style={styles.qiblaAngle}>
                                Qibla: {Math.round(qiblaDirection)}° • Heading:{" "}
                                {Math.round(heading)}°
                            </Text>
                        </View>
                    </GlassSurface>
                )}

                {/* Current Prayer Status */}
                {/* {currentPrayer && (
                    <Card style={styles.currentPrayerCard}>
                        <Card.Content>
                            <Text style={styles.currentPrayerLabel}>
                                Current Prayer
                            </Text>
                            <Text style={styles.currentPrayerName}>
                                {currentPrayer}
                            </Text>
                        </Card.Content>
                    </Card>
                )} */}

                {/* Next Prayer */}
                {nextPrayer && (
                    <GlassSurface style={styles.nextPrayerCard}>
                        <View style={styles.cardContent}>
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
                                color={theme.colors.secondary}
                                style={styles.progressBar}
                            />
                        </View>
                    </GlassSurface>
                )}

                <GlassSurface style={styles.allPrayersCard}>
                    <View style={styles.cardContent}>
                        <Text style={styles.sectionTitle}>
                            Today's Prayer Times
                        </Text>

                        {allPrayers.map((prayer, index) => {
                            const isNext = nextPrayer?.name === prayer.name;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.prayerRow,
                                        isNext && styles.prayerRowActive,
                                    ]}
                                >
                                    <View style={styles.prayerInfo}>
                                        <Text style={styles.prayerIcon}>
                                            {prayer.icon}
                                        </Text>
                                        <View
                                            style={styles.prayerNameContainer}
                                        >
                                            <Text style={styles.prayerName}>
                                                {prayer.name}
                                            </Text>
                                            {isNext && (
                                                <Text style={styles.nextLabel}>
                                                    Next
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.prayerTimeBadge}>
                                        <Text style={styles.prayerTime}>
                                            {prayerService.formatPrayerTime(
                                                prayer.time,
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </GlassSurface>

                {location && (
                    <GlassSurface style={styles.locationCard}>
                        <View
                            style={[styles.cardContent, styles.locationContent]}
                        >
                            <MaterialCommunityIcons
                                name="map-marker"
                                size={20}
                                color={theme.colors.secondary}
                            />
                            <Text style={styles.locationText}>
                                {location.city || "Unknown"},{" "}
                                {location.country || "Unknown"}
                            </Text>
                            <TouchableOpacity onPress={loadPrayerTimes}>
                                <MaterialCommunityIcons
                                    name="refresh"
                                    size={20}
                                    color="rgba(255,255,255,0.75)"
                                />
                            </TouchableOpacity>
                        </View>
                    </GlassSurface>
                )}
            </ScrollView>
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    cardContent: {
        padding: theme.spacing.lg,
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },
    refreshButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.lg,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.onSurface,
    },
    qiblaButton: {
        padding: theme.spacing.xs,
    },
    qiblaCard: {
        marginBottom: theme.spacing.md,
    },
    qiblaContent: {
        alignItems: "center",
    },
    qiblaTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: theme.spacing.xs,
    },
    qiblaSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        marginBottom: theme.spacing.lg,
    },
    compassContainer: {
        width: width * 0.7,
        height: width * 0.7,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: theme.spacing.lg,
    },
    compassCircle: {
        width: "100%",
        height: "100%",
        borderRadius: (width * 0.7) / 2,
        borderWidth: 2,
        borderColor: glass.border,
        backgroundColor: "rgba(0,0,0,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardinalMarker: {
        position: "absolute",
        top: 10,
    },
    cardinalText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    compassTick: {
        position: "absolute",
        width: 2,
        height: 10,
        backgroundColor: glass.borderSubtle,
        top: 5,
    },
    compassTickMajor: {
        height: 20,
        width: 3,
        backgroundColor: theme.colors.secondary,
    },
    qiblaArrow: {
        position: "absolute",
    },
    compassCenter: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.secondary,
    },
    qiblaAngle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        marginTop: theme.spacing.sm,
    },
    nextPrayerCard: {
        marginBottom: theme.spacing.md,
    },
    nextPrayerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    nextPrayerLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        fontWeight: "500",
    },
    timeUntil: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.secondary,
    },
    nextPrayerInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    nextPrayerIcon: {
        fontSize: 36,
        marginRight: theme.spacing.md,
    },
    nextPrayerDetails: {
        flex: 1,
    },
    nextPrayerName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    nextPrayerTime: {
        fontSize: 18,
        color: theme.colors.secondary,
        fontWeight: "600",
    },
    tomorrowLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.65)",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    allPrayersCard: {
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: theme.spacing.md,
    },
    prayerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    prayerRowActive: {
        backgroundColor: glass.backgroundLight,
    },
    prayerInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    prayerIcon: {
        fontSize: 28,
        marginRight: theme.spacing.md,
    },
    prayerNameContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    prayerName: {
        fontSize: 18,
        fontWeight: "500",
        color: "#fff",
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: theme.colors.secondary,
        marginLeft: theme.spacing.sm,
        backgroundColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    prayerTimeBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.spacing.sm,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    prayerTime: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    locationCard: {
        marginBottom: theme.spacing.md,
    },
    locationContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        marginLeft: theme.spacing.sm,
    },
});
