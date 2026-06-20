const todayKey = () => new Date().toISOString().slice(0, 10);

export { todayKey };

export function buildPrayerLocationKey(settings, location) {
    if (settings?.useManualLocation && settings?.selectedCity) {
        const city = settings.selectedCity;
        return `manual:${city.latitude?.toFixed(4)},${city.longitude?.toFixed(4)}`;
    }

    if (location?.latitude != null && location?.longitude != null) {
        return `gps:${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
    }

    return "default";
}

export function buildPrayerSettingsKey(settings) {
    const madhab = settings?.madhab ?? "shafi";
    const method = settings?.calculationMethod ?? "MuslimWorldLeague";
    return `${madhab}:${method}`;
}

export function prayerCacheMatchesSettings(cache, settings) {
    if (!cache?.times || cache.date !== todayKey()) {
        return false;
    }

    const locationKey = buildPrayerLocationKey(settings, cache.location);
    const settingsKey = buildPrayerSettingsKey(settings);

    return (
        cache.locationKey === locationKey && cache.settingsKey === settingsKey
    );
}
