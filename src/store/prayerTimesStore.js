import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerService } from "../services/prayerService";
import { LocationService } from "../services/locationService";
import { useSettingsStore } from "./settingsStore";

const CACHE_KEY = "prayer_times_cache_v1";
const prayerService = PrayerService.getInstance();

const todayKey = () => new Date().toISOString().slice(0, 10);

const serializeTimes = (times) =>
    Object.fromEntries(
        Object.entries(times).map(([key, value]) => [
            key,
            value instanceof Date ? value.toISOString() : value,
        ]),
    );

const deserializeTimes = (times) =>
    Object.fromEntries(
        Object.entries(times).map(([key, value]) => {
            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return [key, new Date(value)];
            }
            return [key, value];
        }),
    );

export const usePrayerTimesStore = create((set, get) => ({
    prayerTimes: null,
    location: null,
    nextPrayer: null,
    currentPrayer: null,
    loading: true,
    refreshing: false,
    initialized: false,

    updatePrayerState: () => {
        const { prayerTimes, location } = get();
        if (!prayerTimes) return;

        set({
            nextPrayer: prayerService.getNextPrayer(prayerTimes, location),
            currentPrayer: prayerService.getCurrentPrayer(prayerTimes, location),
        });
    },

    applyCache: (cache) => {
        if (!cache?.times || cache.date !== todayKey()) return false;

        const times = deserializeTimes(cache.times);
        set({
            prayerTimes: times,
            location: cache.location,
            loading: false,
        });
        get().updatePrayerState();
        import("../services/androidWidgetService")
            .then(({ AndroidWidgetService }) =>
                AndroidWidgetService.syncPrayerWidget(),
            )
            .catch(() => {});
        return true;
    },

    hydrateAndLoad: async () => {
        if (get().initialized) return;
        set({ initialized: true });

        try {
            const raw = await AsyncStorage.getItem(CACHE_KEY);
            if (raw) {
                get().applyCache(JSON.parse(raw));
            }
        } catch (error) {
            console.warn("Prayer cache hydrate failed:", error);
        }

        await get().loadPrayerTimes(false);
    },

    loadPrayerTimes: async (force = false) => {
        const hasData = Boolean(get().prayerTimes);

        if (!hasData) {
            set({ loading: true });
        } else if (force) {
            set({ refreshing: true });
        }

        try {
            const settings = useSettingsStore.getState();
            const location = await LocationService.getCurrentLocation({
                useCache: !force,
                skipPermissionPrompt: true,
                allowFreshGps: force,
            });

            const times = prayerService.calculatePrayerTimes(
                location,
                new Date(),
                {
                    madhab: settings.madhab,
                    calculationMethod: settings.calculationMethod,
                },
            );

            const cache = {
                date: todayKey(),
                times: serializeTimes(times),
                location,
                cachedAt: Date.now(),
            };
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));

            set({
                prayerTimes: times,
                location,
                loading: false,
                refreshing: false,
            });
            get().updatePrayerState();
            const { AndroidWidgetService } = await import(
                "../services/androidWidgetService"
            );
            AndroidWidgetService.syncPrayerWidget().catch(() => {});
        } catch (error) {
            console.error("Error loading prayer times:", error);
            set({ loading: false, refreshing: false });
        }
    },
}));
