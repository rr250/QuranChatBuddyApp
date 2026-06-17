import { create } from "zustand";
import { SubscriptionService } from "../services/subscriptionService";
import { ENTITLEMENT_ID } from "../constants/subscription";

export const useSubscriptionStore = create((set, get) => ({
    isPremium: false,
    offerings: null,
    packages: [],
    loading: false,
    error: null,
    isConfigured: false,

    initialize: async (userId) => {
        try {
            set({ loading: true, error: null });
            const configured = await SubscriptionService.initialize(userId);
            set({ isConfigured: configured });

            if (!configured) {
                set({ loading: false });
                return;
            }

            await get().refresh();
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    refresh: async (paywallId = "default") => {
        if (!get().isConfigured) {
            set({ loading: false, packages: [], error: null });
            return;
        }

        try {
            const [customerInfo, offering] = await Promise.all([
                SubscriptionService.getCustomerInfo(),
                SubscriptionService.getOfferings(paywallId),
            ]);

            const isPremium = Boolean(
                customerInfo.entitlements.active[ENTITLEMENT_ID],
            );

            set({
                isPremium,
                offerings: offering,
                packages: offering?.availablePackages ?? [],
                loading: false,
                error: null,
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    purchase: async (pkg) => {
        try {
            set({ loading: true, error: null });
            const customerInfo = await SubscriptionService.purchasePackage(pkg);
            const isPremium = Boolean(
                customerInfo.entitlements.active[ENTITLEMENT_ID],
            );
            set({ isPremium, loading: false });
            return isPremium;
        } catch (error) {
            if (!error.userCancelled) {
                set({ error: error.message, loading: false });
            } else {
                set({ loading: false });
            }
            throw error;
        }
    },

    restore: async () => {
        try {
            set({ loading: true, error: null });
            const customerInfo = await SubscriptionService.restorePurchases();
            const isPremium = Boolean(
                customerInfo.entitlements.active[ENTITLEMENT_ID],
            );
            set({ isPremium, loading: false });
            return isPremium;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    syncUser: async (userId) => {
        await SubscriptionService.syncUserId(userId);
        await get().refresh();
    },

    reset: async () => {
        await SubscriptionService.logOut();
        set({
            isPremium: false,
            offerings: null,
            packages: [],
            loading: false,
            error: null,
        });
    },
}));
