import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get, set } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";
import { DeviceIdentityService } from "./deviceIdentityService";
import { DeviceAuthService } from "./deviceAuthService";

const localKey = (userId) => `ai_message_count_${userId}`;

export class MessageUsageService {
    static async fetchAuthoritativeCount(userId = "guest") {
        try {
            const deviceHash = await DeviceIdentityService.getDeviceHash();
            if (!deviceHash) return null;

            const usage = await DeviceAuthService.getMessageUsage(deviceHash);
            if (typeof usage?.count !== "number") return null;

            const linkedUid = usage.linkedUid || userId;
            if (linkedUid && linkedUid !== "guest") {
                await AsyncStorage.setItem(
                    localKey(linkedUid),
                    String(usage.count),
                );
            }
            if (userId && userId !== "guest" && userId !== linkedUid) {
                await AsyncStorage.setItem(localKey(userId), String(usage.count));
            }

            return {
                count: usage.count,
                limit: usage.limit,
                linkedUid,
                sessionMismatch: usage.sessionMismatch === true,
            };
        } catch (error) {
            console.warn("Failed to load authoritative message usage:", error);
            return null;
        }
    }

    static async getCount(userId = "guest") {
        try {
            const authoritative = await this.fetchAuthoritativeCount(userId);
            if (authoritative) {
                return authoritative.count;
            }

            const cached = await AsyncStorage.getItem(localKey(userId));
            let localCount = cached !== null ? Number(cached) || 0 : 0;

            if (userId === "guest") {
                return localCount;
            }

            try {
                const database = getFirebaseDatabase();
                const snapshot = await get(
                    ref(database, `users/${userId}/usage/aiMessageCount`),
                );
                const remoteCount = snapshot.exists()
                    ? Number(snapshot.val()) || 0
                    : 0;
                localCount = Math.max(localCount, remoteCount);
                await AsyncStorage.setItem(localKey(userId), String(localCount));
            } catch (error) {
                console.warn("Failed to load remote message count:", error);
            }

            return localCount;
        } catch (error) {
            console.warn("Failed to load message count:", error);
            return 0;
        }
    }

    static async incrementCount(userId = "guest") {
        const nextCount = (await this.getCount(userId)) + 1;
        await AsyncStorage.setItem(localKey(userId), String(nextCount));

        if (userId !== "guest") {
            try {
                const database = getFirebaseDatabase();
                await set(
                    ref(database, `users/${userId}/usage/aiMessageCount`),
                    nextCount,
                );
            } catch (error) {
                console.warn("Failed to sync message count:", error);
            }
        }

        return nextCount;
    }

    static async applyServerCount(userId, count) {
        if (!userId || userId === "guest" || typeof count !== "number") {
            return count ?? 0;
        }

        const authoritative = await this.fetchAuthoritativeCount(userId);
        const targetUid = authoritative?.linkedUid || userId;

        await AsyncStorage.setItem(localKey(targetUid), String(count));
        if (targetUid !== userId) {
            await AsyncStorage.setItem(localKey(userId), String(count));
        }

        try {
            const database = getFirebaseDatabase();
            await set(
                ref(database, `users/${targetUid}/usage/aiMessageCount`),
                count,
            );
        } catch (error) {
            console.warn("Failed to apply server message count:", error);
        }

        return count;
    }
}
