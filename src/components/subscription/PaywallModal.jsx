import React, { useEffect } from "react";
import { View, StyleSheet, Modal, ScrollView } from "react-native";
import { Text, Button, Card, IconButton, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { PREMIUM_FEATURES } from "../../constants/subscription";
import { theme } from "../../constants/theme";

export const PaywallModal = ({ visible, onClose, onSuccess }) => {
    const {
        packages,
        loading,
        error,
        refresh,
        purchase,
        restore,
        isConfigured,
    } = useSubscriptionStore();

    useEffect(() => {
        if (visible) refresh();
    }, [visible]);

    const handlePurchase = async (pkg) => {
        try {
            const success = await purchase(pkg);
            if (success) onSuccess?.();
        } catch (error) {
            if (!error.userCancelled) {
                console.error("Purchase failed:", error);
            }
        }
    };

    const handleRestore = async () => {
        try {
            const success = await restore();
            if (success) onSuccess?.();
        } catch (error) {
            console.error("Restore failed:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Unlock Premium</Text>
                        <IconButton icon="close" iconColor="white" onPress={onClose} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.subtitle}>
                            Deepen your Islamic journey with premium features
                        </Text>

                        {PREMIUM_FEATURES.map((feature) => (
                            <View key={feature} style={styles.featureRow}>
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={22}
                                    color="white"
                                />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}

                        {!isConfigured ? (
                            <Card style={styles.noticeCard}>
                                <Card.Content>
                                    <Text style={styles.noticeText}>
                                        RevenueCat is not configured. Add your API keys to enable
                                        subscriptions before Play Store release.
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : loading && packages.length === 0 ? (
                            <ActivityIndicator color="white" style={styles.loader} />
                        ) : (
                            packages.map((pkg) => (
                                <Button
                                    key={pkg.identifier}
                                    mode="contained"
                                    onPress={() => handlePurchase(pkg)}
                                    loading={loading}
                                    disabled={loading}
                                    style={styles.packageButton}
                                    contentStyle={styles.packageContent}
                                    labelStyle={styles.packageLabel}
                                >
                                    {pkg.product.title} — {pkg.product.priceString}
                                </Button>
                            ))
                        )}

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <Button
                            mode="text"
                            onPress={handleRestore}
                            disabled={loading || !isConfigured}
                            labelStyle={styles.restoreLabel}
                        >
                            Restore Purchases
                        </Button>
                    </ScrollView>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "85%",
        paddingBottom: theme.spacing.xl,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        flex: 1,
        marginLeft: theme.spacing.sm,
    },
    content: {
        padding: theme.spacing.lg,
    },
    subtitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 16,
        marginBottom: theme.spacing.lg,
        textAlign: "center",
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    featureText: {
        color: "white",
        fontSize: 15,
        flex: 1,
    },
    packageButton: {
        backgroundColor: "white",
        marginTop: theme.spacing.md,
        borderRadius: theme.spacing.md,
    },
    packageContent: { paddingVertical: theme.spacing.sm },
    packageLabel: {
        color: theme.colors.primary,
        fontWeight: "bold",
    },
    restoreLabel: { color: "white" },
    errorText: {
        color: "#ffcdd2",
        textAlign: "center",
        marginTop: theme.spacing.md,
    },
    loader: { marginVertical: theme.spacing.xl },
    noticeCard: { marginTop: theme.spacing.lg },
    noticeText: { color: theme.colors.onSurfaceVariant },
});
