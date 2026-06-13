import { useState, useEffect, useCallback } from "react";
import { PrayerService } from "../services/prayerService";
import { LocationService } from "../services/locationService";

const prayerService = PrayerService.getInstance();

export const usePrayerTimes = (refreshIntervalMs = 60000) => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [currentPrayer, setCurrentPrayer] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    const updatePrayerState = useCallback((times) => {
        setNextPrayer(prayerService.getNextPrayer(times));
        setCurrentPrayer(prayerService.getCurrentPrayer(times));
    }, []);

    const loadPrayerTimes = useCallback(async () => {
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
    }, [updatePrayerState]);

    useEffect(() => {
        loadPrayerTimes();
        const interval = setInterval(() => {
            if (prayerTimes) updatePrayerState(prayerTimes);
        }, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [loadPrayerTimes, refreshIntervalMs]);

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

    return {
        prayerTimes,
        nextPrayer,
        currentPrayer,
        location,
        loading,
        loadPrayerTimes,
        getTimeUntilNext,
        getPrayerProgress,
    };
};
