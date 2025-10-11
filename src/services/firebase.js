import { initializeApp } from "firebase/app";
import {
    initializeAuth,
    getReactNativePersistence,
    connectAuthEmulator,
} from "firebase/auth";
import {
    getDatabase,
    connectDatabaseEmulator,
    goOffline,
    goOnline,
    onValue,
} from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

// Firebase configuration - Using environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth;
let database;
let storage;
let functions;

export const initializeFirebase = () => {
    if (!app) {
        // Initialize Firebase app
        app = initializeApp(firebaseConfig);

        // Initialize Auth with persistence
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });

        // Initialize other services (NO FIRESTORE)
        database = getDatabase(app);
        storage = getStorage(app);
        functions = getFunctions(app);

        // Enable offline support for Realtime Database
        enableOfflineSupport();

        // Monitor network connectivity
        setupNetworkMonitoring();

        // In development, connect to emulators if needed
        if (__DEV__) {
            setupEmulators();
        }

        console.log(
            "Firebase initialized successfully with Realtime Database only"
        );
    }

    return { app, auth, database, storage, functions };
};

const enableOfflineSupport = async () => {
    try {
        // Realtime Database offline support is enabled by default
        console.log("Realtime Database offline support enabled");
    } catch (error) {
        console.error("Error enabling offline support:", error);
    }
};

const setupNetworkMonitoring = () => {
    NetInfo.addEventListener((state) => {
        if (state.isConnected) {
            // Go online when network is available
            goOnline(database);
            console.log("Firebase: Network connected, going online");
        } else {
            // Go offline when network is unavailable
            goOffline(database);
            console.log("Firebase: Network disconnected, going offline");
        }
    });
};

const setupEmulators = () => {
    // Only connect to emulators in development and if not already connected
    try {
        // Uncomment these if you're using Firebase emulators locally
        // connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        // connectDatabaseEmulator(database, 'localhost', 9000);
        // connectStorageEmulator(storage, 'localhost', 9199);
        // connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
        console.log("Emulators already connected or not available");
    }
};

// Getters for Firebase services
export const getFirebaseAuth = () => {
    if (!auth) {
        initializeFirebase();
    }
    return auth;
};

export const getFirebaseDatabase = () => {
    if (!database) {
        initializeFirebase();
    }
    return database;
};

export const getFirebaseStorage = () => {
    if (!storage) {
        initializeFirebase();
    }
    return storage;
};

export const getFirebaseFunctions = () => {
    if (!functions) {
        initializeFirebase();
    }
    return functions;
};

// Test database connection
export const testDatabaseConnection = async () => {
    try {
        const db = getFirebaseDatabase();
        console.log("🧪 Testing database connection...");
        console.log("Database URL:", firebaseConfig.databaseURL);

        // Try to read from database
        const { ref, get } = await import("firebase/database");
        const testRef = ref(db, ".info/connected");
        // await DatabaseTestService.runAllTests();

        return new Promise((resolve) => {
            const unsubscribe = onValue(testRef, (snapshot) => {
                console.log("Snapshot value:", snapshot, snapshot.val());
                const connected = snapshot.val();
                if (connected) {
                    console.log("✅ Database connection successful!");
                    console.log("🔗 Connected to:", firebaseConfig.databaseURL);
                    resolve(true);
                } else {
                    console.log("❌ Database connection failed");
                    resolve(false);
                }
            });
            // unsubscribe();
        });
    } catch (error) {
        console.error("❌ Database connection test failed:", error);
        return false;
    }
};
