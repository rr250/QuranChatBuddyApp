import { create } from "zustand";
import { PaywallConfigService } from "../services/paywallConfigService";
import { PAYWALL_PLACEMENTS } from "../constants/paywallConfig";
import { useSubscriptionStore } from "./subscriptionStore";

export const usePaywallStore = create((set, get) => ({
    visible: false,
    allowClose: false,
    activePlacement: null,
    config: null,
    configLoaded: false,
    appOpenPaywallShownThisSession: false,
    personalization: { userName: "" },

    setPersonalization: (personalization) =>
        set({ personalization: { ...get().personalization, ...personalization } }),

    loadConfig: async () => {
        const config = await PaywallConfigService.getConfig();
        set({ config, configLoaded: true });
        return config;
    },

    openPaywall: (placementName) => {
        const config = get().config;
        const placement = PaywallConfigService.getPlacement(config, placementName);
        if (!placement) return false;

        const allowClose = PaywallConfigService.getAllowClose(config, placement);

        set({
            visible: true,
            allowClose,
            activePlacement: {
                name: placementName,
                ...placement,
                paywallId: config.revenueCatOfferingId,
            },
        });
        return true;
    },

    closePaywall: (force = false) => {
        if (!force && !get().allowClose) return false;
        set({ visible: false, activePlacement: null });
        return true;
    },

    /** Returns true when the UI action should be blocked */
    tryShowPlacement: async (placementName) => {
        const isPremium = useSubscriptionStore.getState().isPremium;
        if (isPremium) return false;

        if (!get().configLoaded) {
            await get().loadConfig();
        }

        const opened = get().openPaywall(placementName);
        if (!opened) return false;
        return !get().allowClose;
    },

    /** Show onboarding completion paywall with optional personalization */
    showOnboardingPaywall: async (userName = "") => {
        if (userName) {
            get().setPersonalization({ userName });
        }
        await get().loadConfig();
        const isPremium = useSubscriptionStore.getState().isPremium;
        if (isPremium) return false;

        const opened = get().openPaywall(PAYWALL_PLACEMENTS.ONBOARDING);
        if (opened) {
            set({ appOpenPaywallShownThisSession: true });
        }
        return opened;
    },

    /** Show Onboarding placement on every app open (once per session) */
    showAppOpenPaywallIfNeeded: async () => {
        if (get().appOpenPaywallShownThisSession) return false;

        await get().loadConfig();
        const isPremium = useSubscriptionStore.getState().isPremium;
        if (isPremium) return false;

        if (
            !PaywallConfigService.isPlacementActive(
                get().config,
                PAYWALL_PLACEMENTS.ONBOARDING,
            )
        ) {
            return false;
        }

        const opened = get().openPaywall(PAYWALL_PLACEMENTS.ONBOARDING);
        if (opened) {
            set({ appOpenPaywallShownThisSession: true });
        }
        return opened;
    },
}));
