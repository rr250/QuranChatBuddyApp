import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const FALLBACK_DEVICE_ID_KEY = "qcb_device_install_id";
const DEVICE_HASH_CACHE_KEY = "qcb_device_hash_cache";

const getSalt = () =>
    process.env.EXPO_PUBLIC_DEVICE_HASH_SALT?.trim() ||
    "quran-chat-buddy-device-v1";

const hashValue = async (raw) =>
    Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${getSalt()}:${raw}`,
    );

const getOrCreateFallbackId = async () => {
    const existing = await SecureStore.getItemAsync(FALLBACK_DEVICE_ID_KEY);
    if (existing) return existing;

    const created = Crypto.randomUUID();
    await SecureStore.setItemAsync(FALLBACK_DEVICE_ID_KEY, created);
    return created;
};

/**
 * Stable per-physical-device identifier (survives reinstall / clear app data).
 * - Android: ANDROID_ID
 * - iOS: identifierForVendor (until all apps from this vendor are removed)
 * - Fallback: random UUID in SecureStore (cleared on uninstall; last resort)
 */
export class DeviceIdentityService {
    static cachedHash = null;

    static async getRawDeviceId() {
        if (Platform.OS === "android") {
            return Application.getAndroidId() || null;
        }

        if (Platform.OS === "ios") {
            return (await Application.getIosIdForVendorAsync()) || null;
        }

        return getOrCreateFallbackId();
    }

    static async getDeviceHash() {
        if (this.cachedHash) return this.cachedHash;

        try {
            const cached = await SecureStore.getItemAsync(DEVICE_HASH_CACHE_KEY);
            if (cached) {
                this.cachedHash = cached;
                return cached;
            }
        } catch {
            // SecureStore may be unavailable on web
        }

        const raw = await this.getRawDeviceId();
        if (!raw) return null;

        const hash = await hashValue(raw);
        this.cachedHash = hash;

        try {
            await SecureStore.setItemAsync(DEVICE_HASH_CACHE_KEY, hash);
        } catch {
            // non-fatal
        }

        return hash;
    }
}
