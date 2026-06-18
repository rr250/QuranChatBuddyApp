import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { usePrayerTimes } from "../../hooks/usePrayerTimes";
import { usePaywallAction } from "../../hooks/usePaywallAction";
import { PAYWALL_PLACEMENTS } from "../../constants/paywallConfig";
import { theme } from "../../constants/theme";
import { PrayerTimeWidget } from "./PrayerTimeWidget";

export const PrayerTimesCardMini = () => {
    const { prayerTimes, currentPrayer, nextPrayer, loading } = usePrayerTimes();
    const { withPaywallCheck } = usePaywallAction();
    const openPrayer = withPaywallCheck(
        () => router.push("/(tabs)/prayer"),
        { placement: PAYWALL_PLACEMENTS.PRAYER_COMPLETION },
    );

    return (
        <TouchableOpacity
            onPress={openPrayer}
            activeOpacity={0.88}
            style={styles.wrapper}
        >
            <PrayerTimeWidget
                prayerTimes={prayerTimes}
                currentPrayer={currentPrayer}
                nextPrayer={nextPrayer}
                loading={loading}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: theme.spacing.md,
    },
});
