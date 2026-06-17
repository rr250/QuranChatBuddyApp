import { useEffect, useCallback } from "react";
import { PrayerService } from "../services/prayerService";
import { usePrayerTimesStore } from "../store/prayerTimesStore";

const prayerService = PrayerService.getInstance();

export const usePrayerTimes = (refreshIntervalMs = 60000) => {
    const prayerTimes = usePrayerTimesStore((s) => s.prayerTimes);
    const nextPrayer = usePrayerTimesStore((s) => s.nextPrayer);
    const currentPrayer = usePrayerTimesStore((s) => s.currentPrayer);
    const location = usePrayerTimesStore((s) => s.location);
    const loading = usePrayerTimesStore((s) => s.loading);
    const refreshing = usePrayerTimesStore((s) => s.refreshing);
    const hydrateAndLoad = usePrayerTimesStore((s) => s.hydrateAndLoad);
    const loadPrayerTimes = usePrayerTimesStore((s) => s.loadPrayerTimes);
    const updatePrayerState = usePrayerTimesStore((s) => s.updatePrayerState);

    useEffect(() => {
        hydrateAndLoad();
    }, [hydrateAndLoad]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (prayerTimes) updatePrayerState();
        }, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [prayerTimes, refreshIntervalMs, updatePrayerState]);

    const getTimeUntilNext = useCallback(
        () => (nextPrayer ? prayerService.getTimeUntilNextPrayer(nextPrayer) : "0m"),
        [nextPrayer],
    );

    const getPrayerProgress = useCallback(() => {
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
    }, [prayerTimes, nextPrayer]);

    const currentPrayerLabel =
        typeof currentPrayer === "string"
            ? currentPrayer
            : currentPrayer?.name ?? "—";

    return {
        prayerTimes,
        nextPrayer,
        currentPrayer,
        currentPrayerLabel,
        location,
        loading,
        refreshing,
        loadPrayerTimes: () => loadPrayerTimes(true),
        getTimeUntilNext,
        getPrayerProgress,
    };
};
