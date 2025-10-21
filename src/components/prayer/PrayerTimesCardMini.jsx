// src/components/prayer/PrayerTimesCardMini.jsx - Compact version for home screen
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PrayerService } from "../../services/prayerService";
import { LocationService } from "../../services/locationService";
import { theme } from "../../constants/theme";

export const PrayerTimesCardMini = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const prayerService = PrayerService.getInstance();

  useEffect(() => {
    loadPrayerTimes();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPrayerTimes = async () => {
    try {
      setLoading(true);
      const currentLocation = await LocationService.getCurrentLocation();
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

  if (loading) {
    return (
      <Card style={styles.card} onPress={() => router.push("/(tabs)/prayer")}>
        <Card.Content style={styles.loadingContent}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)/prayer")}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.title}>Prayer Times</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>

          {/* Next Prayer Info - Compact */}
          {nextPrayer && (
            <View style={styles.nextPrayerContainer}>
              <View style={styles.nextPrayerMain}>
                <Text style={styles.nextPrayerIcon}>{nextPrayer.icon}</Text>
                <View style={styles.nextPrayerInfo}>
                  <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
                  <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
                </View>
                <View style={styles.nextPrayerTime}>
                  <Text style={styles.timeUntil}>{getTimeUntilNext()}</Text>
                  <Text style={styles.timeString}>{nextPrayer.timeString}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Today's Prayers - Compact Grid */}
          <View style={styles.prayersGrid}>
            {prayerTimes && ["fajr", "dhuhr", "asr", "maghrib", "isha"].map((name, index) => {
              const icons = ["🌅", "☀️", "🌤️", "🌆", "🌙"];
              const isNext = nextPrayer?.name.toLowerCase() === name;

              return (
                <View
                  key={name}
                  style={[
                    styles.prayerItem,
                    isNext && styles.prayerItemActive,
                  ]}
                >
                  <Text style={styles.prayerItemIcon}>{icons[index]}</Text>
                  <Text style={styles.prayerItemTime}>
                    {prayerService.formatPrayerTime(prayerTimes[name])}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  content: {
    paddingVertical: theme.spacing.sm,
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
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurface,
  },
  nextPrayerContainer: {
    backgroundColor: theme.colors.primaryContainer + "30",
    padding: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  nextPrayerMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextPrayerIcon: {
    fontSize: 32,
    marginRight: theme.spacing.sm,
  },
  nextPrayerInfo: {
    flex: 1,
  },
  nextPrayerLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  nextPrayerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.onSurface,
  },
  nextPrayerTime: {
    alignItems: "flex-end",
  },
  timeUntil: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  timeString: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  prayersGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayerItem: {
    alignItems: "center",
    padding: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    minWidth: 50,
  },
  prayerItemActive: {
    backgroundColor: theme.colors.primary + "15",
  },
  prayerItemIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  prayerItemTime: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
});