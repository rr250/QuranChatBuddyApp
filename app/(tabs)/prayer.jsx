// app/(tabs)/prayer.jsx - Full Prayer Times page with Qibla compass
import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Card,
    Text,
    ProgressBar,
    IconButton,
    Button,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PrayerService } from "../../src/services/prayerService";
import { LocationService } from "../../src/services/locationService";
import { theme } from "../../src/constants/theme";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";

const { width } = Dimensions.get("window");

export default function PrayerScreen() {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [currentPrayer, setCurrentPrayer] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQibla, setShowQibla] = useState(true);

    // Qibla compass state
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    const prayerService = PrayerService.getInstance();

    useEffect(() => {
        loadPrayerTimes();
        const interval = setInterval(updateNextPrayer, 60000);
        return () => clearInterval(interval);
    }, []);

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

    const loadPrayerTimes = async () => {
        try {
            setLoading(true);
            const currentLocation = await LocationService.getCurrentLocation();
            setLocation(currentLocation);

            const times = prayerService.calculatePrayerTimes(currentLocation);
            setPrayerTimes(times);
            updatePrayerState(times);

            // Calculate Qibla direction
            calculateQiblaDirection(currentLocation);
        } catch (error) {
            console.error("Error loading prayer times:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateQiblaDirection = (location) => {
        // Kaaba coordinates
        const kaabaLat = 21.4225;
        const kaabaLng = 39.8262;

        const lat1 = (location.latitude * Math.PI) / 180;
        const lat2 = (kaabaLat * Math.PI) / 180;
        const deltaLng = ((kaabaLng - location.longitude) * Math.PI) / 180;

        const y = Math.sin(deltaLng);
        const x =
            Math.cos(lat1) * Math.tan(lat2) -
            Math.sin(lat1) * Math.cos(deltaLng);

        let qibla = (Math.atan2(y, x) * 180) / Math.PI;
        qibla = (qibla + 360) % 360;

        setQiblaDirection(qibla);
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

        if (currentIndex === 0) return 0;

        const previousPrayerTime = prayerTimes[prayers[currentIndex - 1]];
        const nextPrayerTime = nextPrayer.timestamp;
        const totalDuration = nextPrayerTime - previousPrayerTime;
        const elapsed = now - previousPrayerTime;

        return Math.min(Math.max(elapsed / totalDuration, 0), 1);
    };

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={48}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.loadingText}>
                        Loading prayer times...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                    <Card style={styles.qiblaCard}>
                        <Card.Content style={styles.qiblaContent}>
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
                                                        }
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
                                        color={theme.colors.primary}
                                    />
                                </View>

                                {/* Center Dot */}
                                <View style={styles.compassCenter} />
                            </View>

                            <Text style={styles.qiblaAngle}>
                                Qibla: {Math.round(qiblaDirection)}° • Heading:{" "}
                                {Math.round(heading)}°
                            </Text>
                        </Card.Content>
                    </Card>
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
                    <Card style={styles.nextPrayerCard}>
                        <Card.Content>
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
                        </Card.Content>
                    </Card>
                )}

                {/* All Prayer Times */}
                <Card style={styles.allPrayersCard}>
                    <Card.Content>
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
                                    <View
                                        style={[
                                            styles.prayerTimeBadge,
                                            {
                                                backgroundColor:
                                                    prayer.color + "20",
                                            },
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
                            );
                        })}
                    </Card.Content>
                </Card>

                {/* Location */}
                {location && (
                    <Card style={styles.locationCard}>
                        <Card.Content style={styles.locationContent}>
                            <MaterialCommunityIcons
                                name="map-marker"
                                size={20}
                                color={theme.colors.primary}
                            />
                            <Text style={styles.locationText}>
                                {location.city || "Unknown"},{" "}
                                {location.country || "Unknown"}
                            </Text>
                            <TouchableOpacity onPress={loadPrayerTimes}>
                                <MaterialCommunityIcons
                                    name="refresh"
                                    size={20}
                                    color={theme.colors.onSurfaceVariant}
                                />
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
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
        elevation: 3,
    },
    qiblaContent: {
        alignItems: "center",
        paddingVertical: theme.spacing.lg,
    },
    qiblaTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.xs,
    },
    qiblaSubtitle: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
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
        borderColor: theme.colors.outline,
        backgroundColor: theme.colors.surface,
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
        color: theme.colors.primary,
    },
    compassTick: {
        position: "absolute",
        width: 2,
        height: 10,
        backgroundColor: theme.colors.outline,
        top: 5,
    },
    compassTickMajor: {
        height: 20,
        width: 3,
        backgroundColor: theme.colors.primary,
    },
    qiblaArrow: {
        position: "absolute",
    },
    compassCenter: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
    },
    qiblaAngle: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.sm,
    },
    currentPrayerCard: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.primary + "15",
        elevation: 2,
    },
    currentPrayerLabel: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.xs,
    },
    currentPrayerName: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    nextPrayerCard: {
        marginBottom: theme.spacing.md,
        elevation: 2,
    },
    nextPrayerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    nextPrayerLabel: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        fontWeight: "500",
    },
    timeUntil: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.primary,
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
        color: theme.colors.onSurface,
    },
    nextPrayerTime: {
        fontSize: 18,
        color: theme.colors.primary,
        fontWeight: "600",
    },
    tomorrowLabel: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    allPrayersCard: {
        marginBottom: theme.spacing.md,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.onSurface,
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
        backgroundColor: theme.colors.primaryContainer + "30",
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
        color: theme.colors.onSurface,
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
        backgroundColor: theme.colors.primary + "20",
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    prayerTimeBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.spacing.sm,
    },
    prayerTime: {
        fontSize: 16,
        fontWeight: "bold",
    },
    locationCard: {
        elevation: 2,
    },
    locationContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        marginLeft: theme.spacing.sm,
    },
});
