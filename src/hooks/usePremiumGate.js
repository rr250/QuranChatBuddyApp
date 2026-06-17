import { useMemo } from "react";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { usePaywallStore } from "../store/paywallStore";

export const usePremiumGate = (messageCount = 0) => {
    const isPremium = useSubscriptionStore((s) => s.isPremium);
    const freeMessageCount = usePaywallStore(
        (s) => s.config?.freeMessageCount ?? 10,
    );

    const canAccess = useMemo(
        () => isPremium || messageCount < freeMessageCount,
        [isPremium, messageCount, freeMessageCount],
    );

    const remainingFree = useMemo(
        () => Math.max(0, freeMessageCount - messageCount),
        [messageCount, freeMessageCount],
    );

    return {
        isPremium,
        canAccess,
        remainingFree,
        freeLimit: freeMessageCount,
    };
};
