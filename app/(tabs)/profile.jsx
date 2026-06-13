import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Button, Avatar, Divider, Chip } from "react-native-paper";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useSubscriptionStore } from "../../src/store/subscriptionStore";
import { PaywallModal } from "../../src/components/subscription/PaywallModal";
import { ScreenShell, screenContentPadding } from "../../src/components/navigation/ScreenShell";
import { GlassSurface, AppBackground } from "../../src/components/ui/Glass";
import { GlassSection } from "../../src/components/ui/GlassDashboardCard";
import { theme } from "../../src/constants/theme";
import { glass } from "../../src/constants/glass";

export default function ProfileScreen() {
    const { user, isAnonymous, signOut } = useAuthStore();
    const { isPremium, loading: subscriptionLoading } = useSubscriptionStore();
    const [paywallVisible, setPaywallVisible] = useState(false);

    const displayName = user?.displayName ?? "Guest User";
    const email = user?.email ?? (isAnonymous ? "Anonymous account" : "No email");

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            isAnonymous
                ? "You will lose unsynced data unless you create an account first."
                : "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace("/(auth)/onboarding");
                    },
                },
            ],
        );
    };

    return (
        <ScreenShell title="Profile" subtitle="Your account & preferences">
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={screenContentPadding}
                showsVerticalScrollIndicator={false}
            >
                <GlassSurface style={styles.profileHero}>
                    <View style={styles.profileContent}>
                        <Avatar.Text
                            size={72}
                            label={displayName.charAt(0).toUpperCase()}
                            style={styles.avatar}
                        />
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.email}>{email}</Text>
                        <View style={styles.chipRow}>
                            {isAnonymous ? (
                                <Chip
                                    icon="account-question"
                                    style={styles.chip}
                                    textStyle={styles.chipText}
                                >
                                    Guest Mode
                                </Chip>
                            ) : null}
                            {isPremium ? (
                                <Chip
                                    icon="crown"
                                    style={styles.premiumChip}
                                    textStyle={styles.chipText}
                                >
                                    Premium
                                </Chip>
                            ) : null}
                        </View>
                    </View>
                </GlassSurface>

                {isAnonymous ? (
                    <GlassSection
                        title="Account"
                        description="Create an account to save your progress across devices."
                    >
                        <Button
                            mode="contained"
                            icon="login"
                            onPress={() => router.push("/(auth)/login")}
                            style={styles.actionButton}
                            buttonColor="rgba(255,255,255,0.92)"
                            textColor={theme.colors.primary}
                        >
                            Sign In
                        </Button>
                        <Button
                            mode="outlined"
                            icon="account-plus"
                            onPress={() => router.push("/(auth)/register")}
                            style={styles.actionButton}
                            textColor="#fff"
                        >
                            Create Account
                        </Button>
                    </GlassSection>
                ) : null}

                <GlassSection
                    title="Subscription"
                    description={
                        isPremium
                            ? "You have access to all premium features."
                            : "Upgrade to unlock unlimited AI chat and premium content."
                    }
                >
                    {!isPremium ? (
                        <Button
                            mode="contained"
                            icon="crown"
                            onPress={() => setPaywallVisible(true)}
                            loading={subscriptionLoading}
                            style={styles.actionButton}
                            buttonColor={theme.colors.secondary}
                        >
                            Upgrade to Premium
                        </Button>
                    ) : (
                        <Button
                            mode="outlined"
                            icon="refresh"
                            onPress={() => setPaywallVisible(true)}
                            style={styles.actionButton}
                            textColor="#fff"
                        >
                            Manage Subscription
                        </Button>
                    )}
                </GlassSection>

                <GlassSection title="Quick Links">
                    <View style={styles.linkRow}>
                        <MaterialCommunityIcons
                            name="head-question"
                            size={22}
                            color="#fff"
                        />
                        <Button
                            mode="text"
                            onPress={() => router.push("/(tabs)/quiz/stats")}
                            textColor="#fff"
                            contentStyle={styles.linkButton}
                        >
                            Quiz Statistics
                        </Button>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.linkRow}>
                        <MaterialCommunityIcons
                            name="book-open-page-variant"
                            size={22}
                            color="#fff"
                        />
                        <Button
                            mode="text"
                            onPress={() => router.push("/(tabs)/quran")}
                            textColor="#fff"
                            contentStyle={styles.linkButton}
                        >
                            Quran Reader
                        </Button>
                    </View>
                </GlassSection>

                {!isAnonymous ? (
                    <Button
                        mode="outlined"
                        icon="logout"
                        onPress={handleSignOut}
                        style={styles.signOutButton}
                        textColor="#ffcdd2"
                    >
                        Sign Out
                    </Button>
                ) : null}
            </ScrollView>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                onSuccess={() => setPaywallVisible(false)}
            />
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
    },
    profileHero: { marginBottom: theme.spacing.md },
    profileContent: {
        alignItems: "center",
        padding: theme.spacing.xl,
    },
    avatar: {
        backgroundColor: glass.backgroundStrong,
        marginBottom: theme.spacing.md,
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
    },
    email: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginTop: theme.spacing.xs,
    },
    chipRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    chip: { backgroundColor: glass.backgroundStrong },
    premiumChip: { backgroundColor: theme.colors.islamicGold },
    chipText: { color: "#fff" },
    actionButton: { marginTop: theme.spacing.sm },
    linkRow: { flexDirection: "row", alignItems: "center" },
    linkButton: { justifyContent: "flex-start" },
    divider: {
        backgroundColor: glass.borderSubtle,
        marginVertical: theme.spacing.sm,
    },
    signOutButton: {
        marginTop: theme.spacing.md,
        borderColor: "#ffcdd2",
    },
});
