import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CITY } from "../constants/prayerOptions";
import { PrayerService } from "../services/prayerService";

const STORAGE_KEY = "app_settings_v1";

export const useSettingsStore = create((set, get) => ({
    madhab: "shafi",
    calculationMethod: "MuslimWorldLeague",
    selectedCity: DEFAULT_CITY,
    useManualLocation: false,
    hydrated: false,

    hydrate: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                set({
                    madhab: parsed.madhab ?? "shafi",
                    calculationMethod:
                        parsed.calculationMethod ?? "MuslimWorldLeague",
                    selectedCity: parsed.selectedCity ?? DEFAULT_CITY,
                    useManualLocation: Boolean(parsed.useManualLocation),
                    hydrated: true,
                });
            } else {
                set({ hydrated: true });
            }
        } catch (error) {
            console.warn("Settings hydrate failed:", error);
            set({ hydrated: true });
        }
    },

    persist: async () => {
        const { madhab, calculationMethod, selectedCity, useManualLocation } =
            get();
        const payload = {
            madhab,
            calculationMethod,
            selectedCity,
            useManualLocation,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        await PrayerService.getInstance().savePrayerSettings({
            madhab,
            calculationMethod,
        });
    },

    setMadhab: async (madhab) => {
        set({ madhab });
        await get().persist();
        await get().refreshPrayerTimes();
    },

    setCalculationMethod: async (calculationMethod) => {
        set({ calculationMethod });
        await get().persist();
        await get().refreshPrayerTimes();
    },

    setSelectedCity: async (city) => {
        set({
            selectedCity: city,
            useManualLocation: true,
        });
        await get().persist();
        await get().refreshPrayerTimes();
    },

    setUseManualLocation: async (useManualLocation) => {
        set({ useManualLocation });
        await get().persist();
        await get().refreshPrayerTimes();
    },

    refreshPrayerTimes: async () => {
        const { usePrayerTimesStore } = await import("./prayerTimesStore");
        await usePrayerTimesStore.getState().loadPrayerTimes(true);
    },

    getLocationOverride: () => {
        const { useManualLocation, selectedCity } = get();
        if (!useManualLocation || !selectedCity) return null;

        return {
            latitude: selectedCity.latitude,
            longitude: selectedCity.longitude,
            city: selectedCity.name,
            country: selectedCity.country,
            timestamp: Date.now(),
            isManual: true,
        };
    },
}));
