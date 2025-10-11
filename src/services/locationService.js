import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

export class LocationService {
    static currentLocation = null;

    static async requestPermissions() {
        try {
            // Check if location services are enabled
            const isEnabled = await Location.hasServicesEnabledAsync();
            if (!isEnabled) {
                Alert.alert(
                    "Location Services Disabled",
                    "Please enable location services in your device settings to calculate prayer times.",
                    [{ text: "OK", style: "default" }]
                );
                return false;
            }

            // Request foreground permissions first
            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location Permission Required",
                    "This app needs location access to calculate accurate prayer times for your area. Please grant location permission.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () =>
                                Location.requestForegroundPermissionsAsync(),
                        },
                    ]
                );
                return false;
            }

            console.log("Foreground location permission granted");

            // For iOS, request background permissions if needed
            if (Platform.OS === "ios") {
                const backgroundStatus =
                    await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus.status !== "granted") {
                    console.log(
                        "Background location permission not granted, but foreground is available"
                    );
                    // Don't block the app, background is optional
                } else {
                    console.log("Background location permission granted");
                }
            }

            return true;
        } catch (error) {
            console.error("Error requesting location permissions:", error);
            Alert.alert(
                "Permission Error",
                "Failed to request location permissions. Please try again or check your device settings.",
                [{ text: "OK", style: "default" }]
            );
            return false;
        }
    }

    static async getCurrentLocation(useCache = true) {
        try {
            // Return cached location if available and not too old
            if (useCache && this.currentLocation) {
                const age = Date.now() - this.currentLocation.timestamp;
                const maxAge = 30 * 60 * 1000; // 30 minutes

                if (age < maxAge) {
                    console.log("Using cached location");
                    return this.currentLocation;
                }
            }

            // Check permissions first
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                console.log("No location permission, using default location");
                return this.getDefaultLocation();
            }

            console.log("Getting current location...");

            // Get current location with timeout
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 15000,
                maximumAge: 300000, // 5 minutes
            });

            const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: Date.now(),
                accuracy: location.coords.accuracy,
            };

            console.log("Location obtained:", locationData);

            // Get address information
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

                if (address && address[0]) {
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
                console.log("Could not get address information:", addressError);
                // This is not critical, continue without address
            }

            this.currentLocation = locationData;

            // Save to storage
            try {
                await AsyncStorage.setItem(
                    "lastKnownLocation",
                    JSON.stringify(locationData)
                );
            } catch (storageError) {
                console.log(
                    "Could not save location to storage:",
                    storageError
                );
            }

            return locationData;
        } catch (error) {
            console.error("Error getting current location:", error);

            // Try to return last known location
            const lastKnown = await this.getLastKnownLocation();
            if (lastKnown) {
                console.log("Using last known location");
                return lastKnown;
            }

            // Return default location (Mecca) as fallback
            console.log("Using default location (Mecca)");
            return this.getDefaultLocation();
        }
    }

    static async getLastKnownLocation() {
        try {
            const stored = await AsyncStorage.getItem("lastKnownLocation");
            if (stored) {
                const location = JSON.parse(stored);
                // Check if location is not too old (1 day)
                const age = Date.now() - location.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (age < maxAge) {
                    return location;
                }
            }
        } catch (error) {
            console.error("Error getting last known location:", error);
        }
        return null;
    }

    static getDefaultLocation() {
        // Mecca coordinates as default
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

            return await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 60000, // 1 minute
                    distanceInterval: 100, // 100 meters
                },
                (location) => {
                    const locationData = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        timestamp: Date.now(),
                        accuracy: location.coords.accuracy,
                    };

                    this.currentLocation = locationData;
                    callback(locationData);
                }
            );
        } catch (error) {
            console.error("Error watching location:", error);
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
            console.error("Error getting location name:", error);
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

    // Get Qibla direction from current location
    static getQiblaDirection(location) {
        const meccaLat = 21.4225;
        const meccaLng = 39.8262;

        return this.calculateBearing(
            location.latitude,
            location.longitude,
            meccaLat,
            meccaLng
        );
    }

    // Check if location is available
    static async isLocationAvailable() {
        try {
            const isEnabled = await Location.hasServicesEnabledAsync();
            const { status } = await Location.getForegroundPermissionsAsync();
            return isEnabled && status === "granted";
        } catch (error) {
            console.error("Error checking location availability:", error);
            return false;
        }
    }
}
