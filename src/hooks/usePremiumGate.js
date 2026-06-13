import { useMemo } from "react";
import { useSubscriptionStore } from "../store/subscriptionStore";

const FREE_CHAT_MESSAGES = 5;

export const usePremiumGate = (messageCount = 0) => {
    const isPremium = useSubscriptionStore((s) => s.isPremium);

    const canAccess = useMemo(
        () => isPremium || messageCount < FREE_CHAT_MESSAGES,
        [isPremium, messageCount],
    );

    const remainingFree = useMemo(
        () => Math.max(0, FREE_CHAT_MESSAGES - messageCount),
        [messageCount],
    );

    return { isPremium, canAccess, remainingFree, freeLimit: FREE_CHAT_MESSAGES };
};
