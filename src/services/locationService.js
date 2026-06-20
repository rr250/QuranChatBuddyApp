import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import logger from "./logger";

const MEMORY_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const STORED_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const POSITION_TIMEOUT_MS = 15000;

export class LocationService {
    static currentLocation = null;

    static clearLocationCache() {
        this.currentLocation = null;
    }

    static async getPermissionDetails() {
        try {
            const permission = await Location.getForegroundPermissionsAsync();
            return {
                granted: permission.status === "granted",
                androidAccuracy: permission.android?.accuracy ?? null,
                iosAccuracy: permission.ios?.accuracy ?? null,
            };
        } catch (error) {
            logger.warn("Could not read location permission:", error);
            return {
                granted: false,
                androidAccuracy: null,
                iosAccuracy: null,
            };
        }
    }

    static resolveLocationAccuracy({ androidAccuracy, iosAccuracy } = {}) {
        if (Platform.OS === "android") {
            return androidAccuracy === "coarse"
                ? Location.Accuracy.Low
                : Location.Accuracy.Balanced;
        }

        if (Platform.OS === "ios" && iosAccuracy === "reduced") {
            return Location.Accuracy.Low;
        }

        return Location.Accuracy.Balanced;
    }

    static resolveRequiredAccuracyMeters({ androidAccuracy, iosAccuracy } = {}) {
        if (
            (Platform.OS === "android" && androidAccuracy === "coarse") ||
            (Platform.OS === "ios" && iosAccuracy === "reduced")
        ) {
            return 5000;
        }

        return 1000;
    }

    static async requestPermissions() {
        try {
            const isEnabled = await Location.hasServicesEnabledAsync();
            if (!isEnabled) {
                Alert.alert(
                    "Location Services Disabled",
                    "Please enable location services in your device settings to calculate prayer times.",
                    [{ text: "OK", style: "default" }],
                );
                return false;
            }

            const current = await this.getPermissionDetails();
            if (current.granted) {
                return true;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location Permission Required",
                    "This app needs location access to calculate accurate prayer times for your area. Approximate location is enough if precise location is unavailable.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () =>
                                Location.requestForegroundPermissionsAsync(),
                        },
                    ],
                );
                return false;
            }

            logger.debug("Foreground location permission granted");

            if (Platform.OS === "ios") {
                const backgroundStatus =
                    await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus.status !== "granted") {
                    logger.debug(
                        "Background location permission not granted, but foreground is available",
                    );
                } else {
                    logger.debug("Background location permission granted");
                }
            }

            return true;
        } catch (error) {
            logger.error("Error requesting location permissions:", error);
            Alert.alert(
                "Permission Error",
                "Failed to request location permissions. Please try again or check your device settings.",
                [{ text: "OK", style: "default" }],
            );
            return false;
        }
    }

    static async getManualLocation() {
        try {
            const { useSettingsStore } = await import("../store/settingsStore");
            const override = useSettingsStore.getState().getLocationOverride();
            if (override) {
                return override;
            }
        } catch (error) {
            logger.warn("Could not read manual location settings:", error);
        }
        return null;
    }

    static buildLocationData(position) {
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
        };
    }

    static async enrichLocationWithAddress(locationData) {
        try {
            const address = await Location.reverseGeocodeAsync({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
            });

            if (address?.[0]) {
                locationData.city =
                    address[0].city ||
                    address[0].subregion ||
                    address[0].district;
                locationData.country = address[0].country;
                locationData.region =
                    address[0].region || address[0].administrativeArea;
                locationData.postalCode = address[0].postalCode;
            }
        } catch (addressError) {
            logger.debug(
                "Could not get address information:",
                addressError,
            );
        }

        return locationData;
    }

    static async persistLastKnownLocation(locationData) {
        this.currentLocation = locationData;

        try {
            await AsyncStorage.setItem(
                "lastKnownLocation",
                JSON.stringify(locationData),
            );
        } catch (storageError) {
            logger.debug(
                "Could not save location to storage:",
                storageError,
            );
        }
    }

    static async fetchDevicePosition(permissionDetails) {
        const accuracy = this.resolveLocationAccuracy(permissionDetails);
        const requiredAccuracy =
            this.resolveRequiredAccuracyMeters(permissionDetails);
        const isApproximate =
            permissionDetails.androidAccuracy === "coarse" ||
            permissionDetails.iosAccuracy === "reduced";

        logger.debug("Fetching device position", {
            accuracy,
            isApproximate,
        });

        const positionOptions = {
            accuracy,
            ...(Platform.OS === "android" && {
                mayShowUserSettingsDialog: !isApproximate,
            }),
        };

        try {
            const position = await Promise.race([
                Location.getCurrentPositionAsync(positionOptions),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error("Location request timed out")),
                        POSITION_TIMEOUT_MS,
                    ),
                ),
            ]);

            if (position?.coords?.latitude != null) {
                return position;
            }
        } catch (error) {
            logger.debug("Current position request failed:", error);
        }

        const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: MEMORY_CACHE_MAX_AGE_MS,
            requiredAccuracy,
        });

        if (lastKnown?.coords?.latitude != null) {
            logger.debug("Using OS last known position");
            return lastKnown;
        }

        return null;
    }

    static async getCurrentLocation(options = {}) {
        const {
            useCache = true,
            skipPermissionPrompt = false,
            allowFreshGps = true,
        } = typeof options === "boolean" ? { useCache: options } : options;

        try {
            const manualLocation = await this.getManualLocation();
            if (manualLocation) {
                this.currentLocation = manualLocation;
                return manualLocation;
            }

            if (useCache && this.currentLocation) {
                const age = Date.now() - this.currentLocation.timestamp;
                if (age < MEMORY_CACHE_MAX_AGE_MS) {
                    logger.debug("Using cached location");
                    return this.currentLocation;
                }
            }

            const storedLocation = await this.getLastKnownLocation();
            if (skipPermissionPrompt && useCache && storedLocation) {
                this.currentLocation = storedLocation;
                return storedLocation;
            }

            const hasPermission = skipPermissionPrompt
                ? (await this.getPermissionDetails()).granted
                : await this.requestPermissions();
            if (!hasPermission) {
                const manual = await this.getManualLocation();
                if (manual) return manual;

                if (storedLocation) {
                    logger.debug("No permission, using last known location");
                    return storedLocation;
                }

                logger.debug("No location permission, using default location");
                return this.getDefaultLocation();
            }

            if (!allowFreshGps) {
                if (storedLocation) {
                    logger.debug("Using stored location (GPS fetch skipped)");
                    this.currentLocation = storedLocation;
                    return storedLocation;
                }

                const permissionDetails = await this.getPermissionDetails();
                const osLastKnown = await Location.getLastKnownPositionAsync({
                    maxAge: STORED_CACHE_MAX_AGE_MS,
                    requiredAccuracy: this.resolveRequiredAccuracyMeters(
                        permissionDetails,
                    ),
                });

                if (osLastKnown?.coords?.latitude != null) {
                    const locationData = await this.enrichLocationWithAddress(
                        this.buildLocationData(osLastKnown),
                    );
                    await this.persistLastKnownLocation(locationData);
                    return locationData;
                }

                logger.debug(
                    "No cached location available, skipping GPS fetch",
                );
                return this.getDefaultLocation();
            }

            const permissionDetails = await this.getPermissionDetails();
            const position = await this.fetchDevicePosition(permissionDetails);

            if (!position) {
                if (storedLocation) {
                    logger.debug("Falling back to stored location");
                    return storedLocation;
                }

                return this.getDefaultLocation();
            }

            const locationData = await this.enrichLocationWithAddress(
                this.buildLocationData(position),
            );
            await this.persistLastKnownLocation(locationData);
            return locationData;
        } catch (error) {
            logger.error("Error getting current location:", error);

            const lastKnown = await this.getLastKnownLocation();
            if (lastKnown) {
                logger.debug("Using last known location");
                return lastKnown;
            }

            logger.debug("Using default location (Mecca)");
            return this.getDefaultLocation();
        }
    }

    static async getLastKnownLocation() {
        try {
            const stored = await AsyncStorage.getItem("lastKnownLocation");
            if (stored) {
                const location = JSON.parse(stored);
                const age = Date.now() - location.timestamp;

                if (age < STORED_CACHE_MAX_AGE_MS) {
                    return location;
                }
            }
        } catch (error) {
            logger.error("Error getting last known location:", error);
        }
        return null;
    }

    static getDefaultLocation() {
        return {
            latitude: 21.4225,
            longitude: 39.8262,
            city: "Mecca",
            country: "Saudi Arabia",
            region: "Makkah Province",
            timestamp: Date.now(),
            isDefault: true,
        };
    }

    static async watchLocation(callback) {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            const permissionDetails = await this.getPermissionDetails();
            const accuracy = this.resolveLocationAccuracy(permissionDetails);

            return await Location.watchPositionAsync(
                {
                    accuracy,
                    timeInterval: 60000,
                    distanceInterval: 100,
                },
                (location) => {
                    const locationData = this.buildLocationData(location);
                    this.currentLocation = locationData;
                    callback(locationData);
                },
            );
        } catch (error) {
            logger.error("Error watching location:", error);
            return null;
        }
    }

    static async getLocationName(latitude, longitude) {
        try {
            const address = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (address && address[0]) {
                const city =
                    address[0].city ||
                    address[0].subregion ||
                    address[0].district;
                const country = address[0].country;
                return city && country
                    ? `${city}, ${country}`
                    : "Unknown Location";
            }
        } catch (error) {
            logger.error("Error getting location name:", error);
        }

        return "Unknown Location";
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    static calculateBearing(lat1, lon1, lat2, lon2) {
        const dLon = this.toRadians(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2));
        const x =
            Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
            Math.sin(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.cos(dLon);

        let bearing = this.toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    static getQiblaDirection(location) {
        const meccaLat = 21.4225;
        const meccaLng = 39.8262;

        return this.calculateBearing(
            location.latitude,
            location.longitude,
            meccaLat,
            meccaLng,
        );
    }

    static async isLocationAvailable() {
        try {
            const isEnabled = await Location.hasServicesEnabledAsync();
            const permission = await this.getPermissionDetails();
            return isEnabled && permission.granted;
        } catch (error) {
            logger.error("Error checking location availability:", error);
            return false;
        }
    }
}
