import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get, set } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";

const localKey = (userId) => `ai_message_count_${userId}`;

export class MessageUsageService {
    static async getCount(userId = "guest") {
        try {
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
}
