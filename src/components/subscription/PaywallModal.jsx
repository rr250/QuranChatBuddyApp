import React, { useEffect, useMemo } from "react";
import {
    View,
    StyleSheet,
    Modal,
    ImageBackground,
    Linking,
    BackHandler,
} from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { theme } from "../../constants/theme";
import { APP_LINKS } from "../../constants/appLinks";

const PAYWALL_QUOTE = {
    text: "The best of you are those who learn the Quran and teach it",
    source: "Bukhari 6478",
};

const pickYearlyPackage = (packages) => {
    if (!packages?.length) return null;
    return (
        packages.find(
            (pkg) =>
                pkg.packageType === "ANNUAL" ||
                pkg.identifier?.toLowerCase().includes("year") ||
                pkg.product?.identifier?.toLowerCase().includes("year"),
        ) ?? packages[0]
    );
};

export const PaywallModal = ({
    visible,
    onClose,
    onSuccess,
    allowClose = false,
    paywallId = "default",
    userName = "",
}) => {
    const {
        packages,
        loading,
        error,
        refresh,
        purchase,
        restore,
        isConfigured,
    } = useSubscriptionStore();

    const selectedPackage = useMemo(
        () => pickYearlyPackage(packages),
        [packages],
    );

    useEffect(() => {
        if (visible) refresh(paywallId);
    }, [visible, paywallId]);

    useEffect(() => {
        if (!visible || allowClose) return undefined;

        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            () => true,
        );
        return () => subscription.remove();
    }, [visible, allowClose]);

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        try {
            const success = await purchase(selectedPackage);
            if (success) onSuccess?.();
        } catch (purchaseError) {
            if (!purchaseError.userCancelled) {
                console.error("Purchase failed:", purchaseError);
            }
        }
    };

    const handleRestore = async () => {
        try {
            const success = await restore();
            if (success) onSuccess?.();
        } catch (restoreError) {
            console.error("Restore failed:", restoreError);
        }
    };

    const monthlyEstimate = selectedPackage?.product?.price
        ? (selectedPackage.product.price / 12).toFixed(2)
        : null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            presentationStyle="fullScreen"
            onRequestClose={allowClose ? onClose : undefined}
        >
            <ImageBackground
                source={require("../../../assets/splash.png")}
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={["rgba(10,40,28,0.55)", "rgba(10,40,28,0.92)"]}
                    style={styles.overlay}
                >
                    {allowClose ? (
                        <Button
                            icon="close"
                            mode="text"
                            onPress={onClose}
                            textColor="rgba(255,255,255,0.85)"
                            style={styles.closeButton}
                        >
                            {" "}
                        </Button>
                    ) : null}

                    <View style={styles.content}>
                        <View style={styles.quoteCard}>
                            <Text style={styles.quoteText}>
                                &ldquo;{PAYWALL_QUOTE.text}&rdquo;
                            </Text>
                            <Text style={styles.quoteSource}>
                                — {PAYWALL_QUOTE.source} —
                            </Text>
                        </View>

                        <View style={styles.personalizedCard}>
                            {userName ? (
                                <Text style={styles.greeting}>Dear {userName}</Text>
                            ) : null}
                            <Text style={styles.personalizedText}>
                                Thank you for taking a moment to share about
                                yourself.
                            </Text>
                            <Text style={styles.personalizedText}>
                                Your personalized Quran Chat Buddy is now ready
                                to guide, support, and grow with you on your
                                spiritual journey.
                            </Text>
                            <Text style={styles.personalizedText}>
                                Continue with full access to unlock daily
                                guidance, meaningful conversations, and a deeply
                                personalized experience.
                            </Text>
                        </View>

                        <View style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <MaterialCommunityIcons
                                    name="crown"
                                    size={22}
                                    color="#f5d76e"
                                />
                                <Text style={styles.planTitle}>Yearly</Text>
                            </View>

                            {selectedPackage ? (
                                <>
                                    <Text style={styles.planPrice}>
                                        {selectedPackage.product.priceString}
                                        <Text style={styles.planPeriod}>/yr</Text>
                                    </Text>
                                    {monthlyEstimate ? (
                                        <Text style={styles.planSubtext}>
                                            ${monthlyEstimate}/mo
                                        </Text>
                                    ) : null}
                                </>
                            ) : loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.planSubtext}>
                                    {isConfigured
                                        ? "Loading subscription options..."
                                        : "Add RevenueCat API keys to enable purchases."}
                                </Text>
                            )}
                        </View>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <Button
                            mode="contained"
                            onPress={handlePurchase}
                            loading={loading}
                            disabled={loading || !selectedPackage}
                            style={styles.continueButton}
                            contentStyle={styles.continueContent}
                            labelStyle={styles.continueLabel}
                        >
                            Continue
                        </Button>

                        <View style={styles.footerLinks}>
                            <Button
                                mode="text"
                                onPress={handleRestore}
                                disabled={loading || !isConfigured}
                                labelStyle={styles.footerLabel}
                            >
                                Restore Purchases
                            </Button>
                            <Text style={styles.footerDot}>·</Text>
                            <Button
                                mode="text"
                                onPress={() => Linking.openURL(APP_LINKS.terms)}
                                labelStyle={styles.footerLabel}
                            >
                                Terms
                            </Button>
                            <Text style={styles.footerDot}>·</Text>
                            <Button
                                mode="text"
                                onPress={() => Linking.openURL(APP_LINKS.privacy)}
                                labelStyle={styles.footerLabel}
                            >
                                Privacy
                            </Button>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Modal>
    );
};

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { flex: 1, justifyContent: "flex-end" },
    closeButton: {
        position: "absolute",
        top: 48,
        right: 8,
        zIndex: 2,
    },
    content: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    personalizedCard: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    greeting: {
        color: "white",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: theme.spacing.xs,
    },
    personalizedText: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 15,
        lineHeight: 22,
    },
    quoteCard: {
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    quoteText: {
        color: "white",
        fontSize: 17,
        lineHeight: 26,
        textAlign: "center",
        fontStyle: "italic",
    },
    quoteSource: {
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
        marginTop: theme.spacing.sm,
        fontSize: 13,
    },
    planCard: {
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 18,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    planHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    planTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "600",
    },
    planPrice: {
        color: "white",
        fontSize: 32,
        fontWeight: "700",
    },
    planPeriod: {
        fontSize: 18,
        fontWeight: "500",
    },
    planSubtext: {
        color: "rgba(255,255,255,0.8)",
        marginTop: 4,
        fontSize: 15,
    },
    continueButton: {
        backgroundColor: "white",
        borderRadius: 14,
    },
    continueContent: { paddingVertical: theme.spacing.sm },
    continueLabel: {
        color: theme.colors.primary,
        fontWeight: "700",
        fontSize: 17,
    },
    footerLinks: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: theme.spacing.md,
    },
    footerLabel: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 12,
    },
    footerDot: {
        color: "rgba(255,255,255,0.5)",
        marginHorizontal: 4,
    },
    errorText: {
        color: "#ffcdd2",
        textAlign: "center",
        marginBottom: theme.spacing.sm,
    },
});
