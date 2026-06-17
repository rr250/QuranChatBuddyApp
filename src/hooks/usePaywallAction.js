import { useCallback } from "react";
import { usePaywallStore } from "../store/paywallStore";
import { useSubscriptionStore } from "../store/subscriptionStore";

/**
 * Wraps UI actions with placement-based paywall checks from Firebase Remote Config.
 */
export const usePaywallAction = () => {
    const tryShowPlacement = usePaywallStore((s) => s.tryShowPlacement);
    const isPremium = useSubscriptionStore((s) => s.isPremium);

    const withPaywallCheck = useCallback(
        (action, { placement } = {}) =>
            async (...args) => {
                if (!isPremium && placement) {
                    const blocked = await tryShowPlacement(placement);
                    if (blocked) return;
                }
                return action?.(...args);
            },
        [isPremium, tryShowPlacement],
    );

    return { withPaywallCheck, isPremium };
};
