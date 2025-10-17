import { Coordinates, PrayerTimes, CalculationMethod } from "adhan";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class PrayerService {
    static instance = null;

    static getInstance() {
        if (!PrayerService.instance) {
            PrayerService.instance = new PrayerService();
        }
        return PrayerService.instance;
    }

    getPrayerTimesForDisplay(location, date = new Date()) {
        const now = new Date();
        const currentPrayerTimes = this.calculatePrayerTimes(location, date);

        // Check if current time is past Isha prayer
        const isAfterIsha = now > currentPrayerTimes.isha;

        if (isAfterIsha) {
            // If we're past Isha, show tomorrow's prayer times
            const tomorrow = new Date(date);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowPrayerTimes = this.calculatePrayerTimes(
                location,
                tomorrow
            );

            return {
                ...tomorrowPrayerTimes,
                isNextDay: true,
                displayDate: tomorrow,
            };
        }

        return {
            ...currentPrayerTimes,
            isNextDay: false,
            displayDate: date,
        };
    }

    calculatePrayerTimes(location, date = new Date()) {
        try {
            const coordinates = new Coordinates(
                location.latitude,
                location.longitude
            );
            const params = CalculationMethod.MuslimWorldLeague();

            // Customize calculation method based on location if needed
            if (location.country === "Saudi Arabia") {
                params.madhab = "hanafi"; // or 'shafi'
            }

            const prayerTimes = new PrayerTimes(coordinates, date, params);

            return {
                fajr: prayerTimes.fajr,
                sunrise: prayerTimes.sunrise,
                dhuhr: prayerTimes.dhuhr,
                asr: prayerTimes.asr,
                maghrib: prayerTimes.maghrib,
                isha: prayerTimes.isha,
                qiyam: this.calculateQiyamTime(
                    prayerTimes.maghrib,
                    prayerTimes.fajr
                ),
            };
        } catch (error) {
            console.error("Error calculating prayer times:", error);
            throw error;
        }
    }

    calculateQiyamTime(maghrib, fajr) {
        // Calculate last third of the night for Qiyam prayers
        const maghribTime = moment(maghrib);
        const fajrTime = moment(fajr).add(1, "day");
        const nightDuration = fajrTime.diff(maghribTime);
        const qiyamStart = maghribTime
            .clone()
            .add((nightDuration * 2) / 3, "milliseconds");
        return qiyamStart.toDate();
    }

    getNextPrayer(prayerTimes, location = null) {
        const now = new Date();
        const prayers = [
            { name: "Fajr", time: prayerTimes.fajr, icon: "🌅" },
            { name: "Dhuhr", time: prayerTimes.dhuhr, icon: "☀️" },
            { name: "Asr", time: prayerTimes.asr, icon: "🌤️" },
            { name: "Maghrib", time: prayerTimes.maghrib, icon: "🌆" },
            { name: "Isha", time: prayerTimes.isha, icon: "🌙" },
        ];

        // Find the next prayer
        for (const prayer of prayers) {
            if (prayer.time > now) {
                return {
                    ...prayer,
                    timeString: moment(prayer.time).format("h:mm A"),
                    timestamp: prayer.time,
                };
            }
        }

        // If no prayer today, calculate tomorrow's prayer times and return Fajr
        if (location) {
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowPrayerTimes = this.calculatePrayerTimes(
                    location,
                    tomorrow
                );

                return {
                    name: "Fajr",
                    time: tomorrowPrayerTimes.fajr,
                    timeString: moment(tomorrowPrayerTimes.fajr).format(
                        "h:mm A"
                    ),
                    timestamp: tomorrowPrayerTimes.fajr,
                    icon: "🌅",
                    isTomorrow: true,
                };
            } catch (error) {
                console.error(
                    "Error calculating tomorrow's prayer times:",
                    error
                );
                // Fallback to simple date addition
                const tomorrowFajr = moment(prayerTimes.fajr)
                    .add(1, "day")
                    .toDate();
                return {
                    name: "Fajr",
                    time: tomorrowFajr,
                    timeString: moment(tomorrowFajr).format("h:mm A"),
                    timestamp: tomorrowFajr,
                    icon: "🌅",
                    isTomorrow: true,
                };
            }
        } else {
            // Fallback when location is not available
            const tomorrowFajr = moment(prayerTimes.fajr)
                .add(1, "day")
                .toDate();
            return {
                name: "Fajr",
                time: tomorrowFajr,
                timeString: moment(tomorrowFajr).format("h:mm A"),
                timestamp: tomorrowFajr,
                icon: "🌅",
                isTomorrow: true,
            };
        }
    }

    getTimeUntilNextPrayer(nextPrayer) {
        if (!nextPrayer) return "0m";

        const now = new Date();
        const diff = nextPrayer.timestamp - now;

        if (diff <= 0) return "0m";

        const duration = moment.duration(diff);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    getDayProgress() {
        const now = new Date();
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();

        const totalMilliseconds = endOfDay - startOfDay;
        const elapsedMilliseconds = now - startOfDay;

        return Math.round((elapsedMilliseconds / totalMilliseconds) * 100);
    }

    getCurrentPrayer(prayerTimes, location = null) {
        const now = new Date();

        // Check if we're past Isha - if so, we're in the period between Isha and tomorrow's Fajr
        if (now > prayerTimes.isha) {
            // Try to get tomorrow's Fajr time for accurate determination
            if (location) {
                try {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowPrayerTimes = this.calculatePrayerTimes(
                        location,
                        tomorrow
                    );

                    // If current time is before tomorrow's Fajr, we're in post-Isha period
                    if (now < tomorrowPrayerTimes.fajr) {
                        return "Post-Isha";
                    }
                } catch (error) {
                    console.error(
                        "Error calculating tomorrow's prayer times:",
                        error
                    );
                }
            }
            return "Post-Isha";
        }

        const prayers = [
            { name: "Fajr", start: prayerTimes.fajr, end: prayerTimes.sunrise },
            { name: "Dhuhr", start: prayerTimes.dhuhr, end: prayerTimes.asr },
            { name: "Asr", start: prayerTimes.asr, end: prayerTimes.maghrib },
            {
                name: "Maghrib",
                start: prayerTimes.maghrib,
                end: prayerTimes.isha,
            },
            { name: "Isha", start: prayerTimes.isha, end: null },
        ];

        for (const prayer of prayers) {
            if (
                now >= prayer.start &&
                (prayer.end === null || now < prayer.end)
            ) {
                return prayer.name;
            }
        }

        // If before Fajr
        if (now < prayerTimes.fajr) {
            return "Pre-Fajr";
        }

        return null;
    }

    async savePrayerSettings(settings) {
        try {
            await AsyncStorage.setItem(
                "prayerSettings",
                JSON.stringify(settings)
            );
        } catch (error) {
            console.error("Error saving prayer settings:", error);
        }
    }

    async getPrayerSettings() {
        try {
            const settings = await AsyncStorage.getItem("prayerSettings");
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (error) {
            console.error("Error getting prayer settings:", error);
        }

        // Return default settings
        return {
            calculationMethod: "MuslimWorldLeague",
            madhab: "shafi",
            notifications: {
                fajr: true,
                dhuhr: true,
                asr: true,
                maghrib: true,
                isha: true,
            },
            reminderMinutes: 10,
        };
    }

    getQiblaDirection(location) {
        const meccaLat = 21.4225;
        const meccaLng = 39.8262;

        const lat1 = this.toRadians(location.latitude);
        const lat2 = this.toRadians(meccaLat);
        const deltaLng = this.toRadians(meccaLng - location.longitude);

        const y = Math.sin(deltaLng) * Math.cos(lat2);
        const x =
            Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

        let bearing = this.toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    formatPrayerTime(time) {
        return moment(time).format("h:mm A");
    }

    getIslamicDate() {
        // This would ideally use a proper Hijri calendar library
        // For now, return a placeholder
        return {
            day: 1,
            month: "Muharram",
            year: 1446,
        };
    }

    async checkMissedPrayers(prayerTimes) {
        try {
            const lastCheck = await AsyncStorage.getItem("lastPrayerCheck");
            const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(0);
            const now = new Date();

            const missedPrayers = [];
            const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

            for (const prayerName of prayers) {
                const prayerTime = prayerTimes[prayerName];
                if (prayerTime > lastCheckTime && prayerTime < now) {
                    missedPrayers.push({
                        name: prayerName,
                        time: prayerTime,
                        missed: true,
                    });
                }
            }

            await AsyncStorage.setItem("lastPrayerCheck", now.toISOString());
            return missedPrayers;
        } catch (error) {
            console.error("Error checking missed prayers:", error);
            return [];
        }
    }
}
