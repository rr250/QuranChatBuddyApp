import { Platform } from "react-native";

import Purchases, { LOG_LEVEL } from "react-native-purchases";

import { ENTITLEMENT_ID, OFFERING_ID } from "../constants/subscription";
import { ref, set } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";



const getApiKey = () => {

    const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;

    if (__DEV__ && testKey) {

        return testKey;

    }



    return Platform.select({

        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,

        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,

        default: testKey,

    });

};



let isConfigured = false;



export const SubscriptionService = {

    async initialize(userId) {

        const API_KEY = getApiKey();

        if (!API_KEY) {

            console.warn(

                "RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_TEST_API_KEY (dev) or platform keys for release builds.",

            );

            return false;

        }



        try {

            if (__DEV__) {

                Purchases.setLogLevel(LOG_LEVEL.DEBUG);

            }



            if (!isConfigured) {

                Purchases.configure({ apiKey: API_KEY, appUserID: userId ?? null });

                isConfigured = true;

            } else if (userId) {

                await Purchases.logIn(userId);

            }



            return true;

        } catch (error) {

            console.error("RevenueCat initialization error:", error);

            return false;

        }

    },



    async getCustomerInfo() {

        try {

            return await Purchases.getCustomerInfo();

        } catch (error) {

            console.error("Error fetching customer info:", error);

            throw error;

        }

    },



    async isPremium() {

        try {

            const customerInfo = await this.getCustomerInfo();

            return Boolean(

                customerInfo.entitlements.active[ENTITLEMENT_ID],

            );

        } catch {

            return false;

        }

    },



    async getOfferings(paywallId = OFFERING_ID) {

        try {

            const offerings = await Purchases.getOfferings();

            return (

                offerings.all[paywallId] ??

                offerings.current ??

                offerings.all[OFFERING_ID] ??

                Object.values(offerings.all ?? {})[0] ??

                null

            );

        } catch (error) {

            console.error("Error fetching offerings:", error);

            throw error;

        }

    },



    async purchasePackage(pkg) {

        try {

            const { customerInfo } = await Purchases.purchasePackage(pkg);

            return customerInfo;

        } catch (error) {

            if (!error.userCancelled) {

                console.error("Purchase error:", error);

            }

            throw error;

        }

    },



    async restorePurchases() {

        try {

            return await Purchases.restorePurchases();

        } catch (error) {

            console.error("Restore purchases error:", error);

            throw error;

        }

    },



    async syncUserId(userId) {

        if (!isConfigured || !userId) return;

        try {

            await Purchases.logIn(userId);

        } catch (error) {

            console.error("RevenueCat logIn error:", error);

        }

    },



    async syncPremiumStatus(userId, isPremium) {

        if (!userId) return;

        try {

            await set(
                ref(getFirebaseDatabase(), `users/${userId}/subscription/isPremium`),
                Boolean(isPremium),
            );

        } catch (error) {

            console.warn("Failed to sync premium status:", error);

        }

    },



    async logOut() {

        if (!isConfigured) return;

        try {

            await Purchases.logOut();

        } catch (error) {

            console.error("RevenueCat logOut error:", error);

        }

    },

};


