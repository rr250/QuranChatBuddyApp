import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerService } from "../services/prayerService";
import { LocationService } from "../services/locationService";
import { PRAYER_WIDGET_ITEMS } from "../constants/faithNotifications";
import { DEFAULT_CITY } from "../constants/prayerOptions";
import { prayerCacheMatchesSettings } from "../utils/prayerCache";
import logger from "../services/logger";

const PRAYER_CACHE_KEY = "prayer_times_cache_v1";
const SETTINGS_KEY = "app_settings_v1";

const deserializeTimes = (times) =>
    Object.fromEntries(
        Object.entries(times).map(([key, value]) => {
            if (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}T/.test(value)
            ) {
                return [key, new Date(value)];
            }
            return [key, value];
        }),
    );

const formatPrayerTime = (value) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const normalizePrayerKey = (name) =>
    typeof name === "string" ? name.toLowerCase() : "";

const resolveActivePrayerKey = (currentPrayer, nextPrayer) => {
    const current = normalizePrayerKey(
        typeof currentPrayer === "string" ? currentPrayer : currentPrayer?.name,
    );
    if (PRAYER_WIDGET_ITEMS.some((item) => item.key === current)) {
        return current;
    }

    const next = normalizePrayerKey(nextPrayer?.name);
    if (PRAYER_WIDGET_ITEMS.some((item) => item.key === next)) {
        return next;
    }

    return null;
};

const readSettings = async () => {
    try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return {
                madhab: "shafi",
                calculationMethod: "MuslimWorldLeague",
                selectedCity: DEFAULT_CITY,
                useManualLocation: false,
            };
        }

        const parsed = JSON.parse(raw);
        return {
            madhab: parsed.madhab ?? "shafi",
            calculationMethod: parsed.calculationMethod ?? "MuslimWorldLeague",
            selectedCity: parsed.selectedCity ?? DEFAULT_CITY,
            useManualLocation: Boolean(parsed.useManualLocation),
        };
    } catch (error) {
        logger.warn("Widget settings read failed:", error);
        return {
            madhab: "shafi",
            calculationMethod: "MuslimWorldLeague",
            selectedCity: DEFAULT_CITY,
            useManualLocation: false,
        };
    }
};

const resolveLocation = async (settings, cacheLocation) => {
    if (settings.useManualLocation && settings.selectedCity) {
        return {
            latitude: settings.selectedCity.latitude,
            longitude: settings.selectedCity.longitude,
            city: settings.selectedCity.name,
            country: settings.selectedCity.country,
        };
    }

    if (cacheLocation?.latitude && cacheLocation?.longitude) {
        return cacheLocation;
    }

    const manual = await LocationService.getManualLocation();
    if (manual) return manual;

    const stored = await LocationService.getLastKnownLocation();
    if (stored) return stored;

    return LocationService.getDefaultLocation();
};

export async function loadPrayerWidgetData() {
    const prayerService = PrayerService.getInstance();

    try {
        const settings = await readSettings();
        let cache = null;

        try {
            const raw = await AsyncStorage.getItem(PRAYER_CACHE_KEY);
            if (raw) cache = JSON.parse(raw);
        } catch (error) {
            logger.warn("Widget prayer cache read failed:", error);
        }

        let prayerTimes = null;
        let location = null;

        if (prayerCacheMatchesSettings(cache, settings)) {
            prayerTimes = deserializeTimes(cache.times);
            location = cache.location;
        } else {
            location = await resolveLocation(settings, cache?.location);
            prayerTimes = prayerService.calculatePrayerTimes(
                location,
                new Date(),
                {
                    madhab: settings.madhab,
                    calculationMethod: settings.calculationMethod,
                },
            );
        }

        const nextPrayer = prayerService.getNextPrayer(prayerTimes, location);
        const currentPrayer = prayerService.getCurrentPrayer(
            prayerTimes,
            location,
        );
        const activeKey = resolveActivePrayerKey(currentPrayer, nextPrayer);
        const locationLabel = location?.city
            ? `${location.city}${location.country ? `, ${location.country}` : ""}`
            : null;

        return {
            loading: false,
            error: null,
            prayerTimes,
            activeKey,
            locationLabel,
            items: PRAYER_WIDGET_ITEMS.map((prayer) => ({
                key: prayer.key,
                label: prayer.label,
                time: formatPrayerTime(prayerTimes?.[prayer.key]),
                isActive: prayer.key === activeKey,
            })),
        };
    } catch (error) {
        logger.error("Widget prayer data failed:", error);
        return {
            loading: false,
            error: "Open app to load prayer times",
            prayerTimes: null,
            activeKey: null,
            locationLabel: null,
            items: PRAYER_WIDGET_ITEMS.map((prayer) => ({
                key: prayer.key,
                label: prayer.label,
                time: "—",
                isActive: false,
            })),
        };
    }
}
