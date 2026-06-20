import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase, goOffline, goOnline } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import logger from "./logger";

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

export const getFirebaseApp = () => {
    if (!app) {
        initializeFirebase();
    }
    return app;
};

export const initializeFirebase = () => {
    if (!app) {
        app = initializeApp(firebaseConfig);

        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });

        database = getDatabase(app);
        storage = getStorage(app);
        functions = getFunctions(app);

        setupNetworkMonitoring();
        logger.info("Firebase initialized");
    }

    return { app, auth, database, storage, functions };
};

const setupNetworkMonitoring = () => {
    NetInfo.addEventListener((state) => {
        if (state.isConnected) {
            goOnline(database);
        } else {
            goOffline(database);
        }
    });
};

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
