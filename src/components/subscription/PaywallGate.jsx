import React, { useEffect } from "react";
import { usePaywallStore } from "../../store/paywallStore";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { PaywallModal } from "./PaywallModal";

export const PaywallGate = () => {
    const visible = usePaywallStore((s) => s.visible);
    const allowClose = usePaywallStore((s) => s.allowClose);
    const activePlacement = usePaywallStore((s) => s.activePlacement);
    const userName = usePaywallStore((s) => s.personalization.userName);
    const closePaywall = usePaywallStore((s) => s.closePaywall);
    const loadConfig = usePaywallStore((s) => s.loadConfig);
    const isPremium = useSubscriptionStore((s) => s.isPremium);

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        if (isPremium && visible) {
            closePaywall(true);
        }
    }, [isPremium, visible]);

    return (
        <PaywallModal
            visible={visible && !isPremium}
            allowClose={allowClose}
            paywallId={activePlacement?.paywallId ?? "premium-worldwide-a"}
            userName={userName}
            onClose={() => closePaywall(false)}
            onSuccess={() => closePaywall(true)}
        />
    );
};
