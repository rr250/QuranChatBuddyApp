import { City, Country } from "country-state-city";

let cityIndex = null;

const buildCityIndex = () => {
    const countryMap = Object.fromEntries(
        Country.getAllCountries().map((c) => [c.isoCode, c.name]),
    );

    return City.getAllCities().map((city) => ({
        id: `${city.countryCode}-${city.name}-${city.latitude}`,
        name: city.name,
        country: countryMap[city.countryCode] || city.countryCode,
        latitude: parseFloat(city.latitude),
        longitude: parseFloat(city.longitude),
    }));
};

export const getCityIndex = () => {
    if (!cityIndex) {
        cityIndex = buildCityIndex();
    }
    return cityIndex;
};

export const searchCities = (query, limit = 60) => {
    const all = getCityIndex();
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
        return all.slice(0, limit);
    }

    return all
        .filter(
            (city) =>
                city.name.toLowerCase().includes(trimmed) ||
                city.country.toLowerCase().includes(trimmed),
        )
        .slice(0, limit);
};
