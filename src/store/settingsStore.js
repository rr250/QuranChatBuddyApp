import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { DEFAULT_CITY } from "../constants/prayerOptions";
import { PrayerService } from "../services/prayerService";
import { LocationService } from "../services/locationService";

const STORAGE_KEY = "app_settings_v1";

const toCityFromLocation = (location) => ({
    name: location?.city || DEFAULT_CITY.name,
    country: location?.country || DEFAULT_CITY.country,
    latitude: location?.latitude ?? DEFAULT_CITY.latitude,
    longitude: location?.longitude ?? DEFAULT_CITY.longitude,
});

export const useSettingsStore = create((set, get) => ({
    madhab: "shafi",
    calculationMethod: "MuslimWorldLeague",
    selectedCity: DEFAULT_CITY,
    detectedCity: null,
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
                    detectedCity: parsed.detectedCity ?? null,
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
        const {
            madhab,
            calculationMethod,
            selectedCity,
            detectedCity,
            useManualLocation,
        } = get();
        const payload = {
            madhab,
            calculationMethod,
            selectedCity,
            detectedCity,
            useManualLocation,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        await PrayerService.getInstance().savePrayerSettings({
            madhab,
            calculationMethod,
        });
    },

    applyDeviceLocation: async (location) => {
        if (!location) return null;

        const city = toCityFromLocation(location);
        set({
            selectedCity: city,
            detectedCity: city,
            useManualLocation: false,
        });
        await get().persist();
        await get().refreshPrayerTimes();
        return city;
    },

    syncDetectedCity: async ({ silent = false } = {}) => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== "granted") {
                return null;
            }

            const location = await LocationService.getCurrentLocation({
                skipPermissionPrompt: true,
                useCache: !silent,
                allowFreshGps: !silent,
            });

            if (
                !location?.latitude ||
                !location?.longitude ||
                location.isDefault
            ) {
                return null;
            }

            return get().applyDeviceLocation(location);
        } catch (error) {
            if (!silent) {
                console.warn("Could not sync detected city:", error);
            }
            return null;
        }
    },

    useCurrentLocation: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            return { success: false, reason: "permission_denied" };
        }

        const location = await LocationService.getCurrentLocation({
            skipPermissionPrompt: true,
            useCache: false,
        });
        const city = await get().applyDeviceLocation(location);
        return { success: Boolean(city), city };
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

    getDisplayCity: () => {
        const { useManualLocation, selectedCity, detectedCity } = get();
        if (useManualLocation) {
            return {
                city: selectedCity,
                label: selectedCity?.name
                    ? `${selectedCity.name}${selectedCity.country ? `, ${selectedCity.country}` : ""}`
                    : "Select city",
                isCurrentLocation: false,
            };
        }

        const city = detectedCity ?? selectedCity;
        return {
            city,
            label: city?.name
                ? `${city.name}${city.country ? `, ${city.country}` : ""} · Current location`
                : "Current location",
            isCurrentLocation: true,
        };
    },
}));
