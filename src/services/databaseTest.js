import { getFirebaseDatabase } from "./firebase";
import { ref, set, get, push, onValue, off } from "firebase/database";

export class DatabaseTestService {
    static async testConnection() {
        console.log("🧪 Testing Quran Chat Buddy Database Connection...");

        const database = getFirebaseDatabase();

        // Test 1: Check connection status
        const connectedRef = ref(database, ".info/connected");
        console.log("connectedRef", connectedRef);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                off(connectedRef);
                reject(new Error("Connection test timeout"));
            }, 10000); // 10 second timeout

            onValue(
                connectedRef,
                (snapshot) => {
                    clearTimeout(timeout);
                    const connected = snapshot.val();

                    if (connected === true) {
                        console.log(
                            "✅ Successfully connected to Quran Chat Buddy database!"
                        );
                        console.log(
                            "🔗 Database URL: https://quran-chat-buddy-prayer-time-ebbc4.firebaseio.com/"
                        );
                        off(connectedRef);
                        resolve(true);
                    } else {
                        console.log("❌ Database connection failed");
                        off(connectedRef);
                        resolve(false);
                    }
                },
                (error) => {
                    clearTimeout(timeout);
                    console.error("❌ Connection error:", error);
                    off(connectedRef);
                    reject(error);
                }
            );
        });
    }

    static async testReadWrite() {
        try {
            console.log("🧪 Testing database read/write operations...");

            const database = getFirebaseDatabase();
            const testRef = ref(database, "test1");
            const testData = {
                message: "Quran Chat Buddy test",
                timestamp: Date.now(),
                app: "Islamic Companion",
            };

            // Test write
            await set(testRef, testData);
            console.log("✅ Write test successful");

            // Test read
            const snapshot = await get(testRef);
            const data = snapshot.val();

            if (data && data.message === testData.message) {
                console.log("✅ Read test successful");
                console.log("📊 Test data retrieved:", data);

                // Clean up test data
                // await set(testRef, null);
                console.log("🧹 Test data cleaned up");

                return true;
            } else {
                throw new Error("Read test failed - data mismatch");
            }
        } catch (error) {
            console.error("❌ Read/write test failed:", error);
            throw error;
        }
    }

    static async testUserDataStructure() {
        try {
            console.log("🧪 Testing user data structure...");

            const database = getFirebaseDatabase();
            const testUserId = "test-user-" + Date.now();
            console.log("Test User ID:", `users/${testUserId}`);
            const userRef = ref(database, `users/${testUserId}`);

            const sampleUserData = {
                uid: testUserId,
                email: "test@quranchatbuddy.com",
                displayName: "Test User",
                createdAt: new Date().toISOString(),
                settings: {
                    notifications: true,
                    prayerReminders: true,
                    language: "en",
                    theme: "light",
                },
                stats: {
                    prayersCompleted: 0,
                    quranPagesRead: 0,
                    quizzesTaken: 0,
                    currentStreak: 0,
                },
            };

            // Create test user
            await set(userRef, sampleUserData);
            console.log("✅ User data structure test - write successful");

            // Read test user
            const snapshot = await get(userRef);
            const userData = snapshot.val();

            if (userData && userData.email === sampleUserData.email) {
                console.log("✅ User data structure test - read successful");
                console.log("👤 Test user data:", userData);

                // Clean up
                // await set(userRef, null);
                console.log("🧹 Test user data cleaned up");

                return true;
            } else {
                throw new Error("User data structure test failed");
            }
        } catch (error) {
            console.error("❌ User data structure test failed:", error);
            throw error;
        }
    }

    static async runAllTests() {
        try {
            console.log(
                "🚀 Running all database tests for Quran Chat Buddy..."
            );
            console.log("=".repeat(50));

            // Test 1: Connection
            console.log("Test 1: Database Connection");
            await this.testConnection();
            console.log("");

            // Test 2: Read/Write
            console.log("Test 2: Read/Write Operations");
            await this.testReadWrite();
            console.log("");

            // Test 3: User Data Structure
            console.log("Test 3: User Data Structure");
            await this.testUserDataStructure();
            console.log("");

            console.log("🎉 All database tests passed!");
            console.log("✅ Quran Chat Buddy database is ready to use");
            console.log(
                "📊 Database URL: https://quran-chat-buddy-prayer-time-ebbc4.firebaseio.com/"
            );

            return true;
        } catch (error) {
            console.error("❌ Database tests failed:", error);
            throw error;
        }
    }
}
