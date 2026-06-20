import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
    Linking,
} from "react-native";
import { Text, Button, Avatar, Divider, Chip } from "react-native-paper";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useSubscriptionStore } from "../../src/store/subscriptionStore";
import { useSettingsStore } from "../../src/store/settingsStore";
import { PaywallModal } from "../../src/components/subscription/PaywallModal";
import { OptionPickerSheet } from "../../src/components/settings/OptionPickerSheet";
import { CityPickerSheet } from "../../src/components/settings/CityPickerSheet";
import {
    ScreenShell,
    screenContentPadding,
} from "../../src/components/navigation/ScreenShell";
import { GlassSurface } from "../../src/components/ui/Glass";
import { GlassSection } from "../../src/components/ui/GlassDashboardCard";
import { theme } from "../../src/theme";
import { glass } from "../../src/theme";
import { APP_LINKS } from "../../src/constants/appLinks";
import {
    MADHAB_OPTIONS,
    CALCULATION_METHODS,
} from "../../src/constants/prayerOptions";

const PreferenceRow = ({ label, value, onPress, showDivider = true }) => (
    <>
        <TouchableOpacity style={styles.prefRow} onPress={onPress}>
            <View style={styles.prefText}>
                <Text style={styles.prefLabel}>{label}</Text>
                {value ? <Text style={styles.prefValue}>{value}</Text> : null}
            </View>
            <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color="rgba(255,255,255,0.6)"
            />
        </TouchableOpacity>
        {showDivider ? <Divider style={styles.divider} /> : null}
    </>
);

const LegalRow = ({ label, onPress, showDivider = true }) => (
    <>
        <TouchableOpacity style={styles.legalRow} onPress={onPress}>
            <Text style={styles.legalLabel}>{label}</Text>
            <MaterialCommunityIcons
                name="open-in-new"
                size={18}
                color="rgba(255,255,255,0.55)"
            />
        </TouchableOpacity>
        {showDivider ? <Divider style={styles.divider} /> : null}
    </>
);

export default function ProfileScreen() {
    const { user, isAnonymous, signOut } = useAuthStore();
    const { isPremium, loading: subscriptionLoading } = useSubscriptionStore();
    const {
        madhab,
        calculationMethod,
        selectedCity,
        useManualLocation,
        hydrate,
        syncDetectedCity,
        setMadhab,
        setCalculationMethod,
        setSelectedCity,
        useCurrentLocation,
        getDisplayCity,
    } = useSettingsStore();

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [madhabPickerVisible, setMadhabPickerVisible] = useState(false);
    const [methodPickerVisible, setMethodPickerVisible] = useState(false);
    const [cityPickerVisible, setCityPickerVisible] = useState(false);

    useEffect(() => {
        hydrate().then(() => syncDetectedCity({ silent: true }));
    }, [hydrate, syncDetectedCity]);

    const cityDisplay = getDisplayCity();

    const displayName = user?.displayName ?? "Guest User";
    const email =
        user?.email ?? (isAnonymous ? "Anonymous account" : "No email");

    const madhabLabel =
        MADHAB_OPTIONS.find((option) => option.id === madhab)?.label ?? madhab;
    const methodLabel =
        CALCULATION_METHODS.find((option) => option.id === calculationMethod)
            ?.label ?? calculationMethod;

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
                        router.replace("/(auth)/login");
                    },
                },
            ],
        );
    };

    const handleUseCurrentLocation = async () => {
        const result = await useCurrentLocation();
        if (!result.success) {
            Alert.alert(
                "Location permission needed",
                "Enable location access to use your current city for prayer times.",
            );
        }
    };

    return (
        <ScreenShell title="Profile" subtitle="Account, preferences & settings">
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
                    title="Preferences"
                    description="Prayer times use your current location when enabled, otherwise your selected city."
                >
                    <PreferenceRow
                        label="Madhab"
                        value={madhabLabel}
                        onPress={() => setMadhabPickerVisible(true)}
                    />
                    <PreferenceRow
                        label="City"
                        value={cityDisplay.label}
                        onPress={() => setCityPickerVisible(true)}
                    />
                    <PreferenceRow
                        label="Calculation Method"
                        value={methodLabel}
                        onPress={() => setMethodPickerVisible(true)}
                        showDivider={false}
                    />
                </GlassSection>

                <GlassSection
                    title="Subscription"
                    description={
                        isPremium
                            ? "You have access to all premium features."
                            : "Upgrade to unlock unlimited QCB chat and premium content."
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

                <GlassSection title="Legal & Support">
                    <LegalRow
                        label="Terms of Service"
                        onPress={() => Linking.openURL(APP_LINKS.terms)}
                    />
                    <LegalRow
                        label="Privacy Policy"
                        onPress={() => Linking.openURL(APP_LINKS.privacy)}
                    />
                    <LegalRow
                        label="Contact Us"
                        onPress={() => Linking.openURL(APP_LINKS.contact)}
                    />
                    <LegalRow
                        label="quranchatbuddy.com"
                        onPress={() => Linking.openURL(APP_LINKS.home)}
                        showDivider={false}
                    />
                </GlassSection>

                <Text style={styles.footer}>
                    © 2026 Quran Chat Buddy — Prayer Time. All rights reserved.
                </Text>

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

            <OptionPickerSheet
                visible={madhabPickerVisible}
                title="Select Madhab"
                options={MADHAB_OPTIONS}
                selectedId={madhab}
                onSelect={(option) => setMadhab(option.id)}
                onClose={() => setMadhabPickerVisible(false)}
            />
            <OptionPickerSheet
                visible={methodPickerVisible}
                title="Select Calculation Method"
                options={CALCULATION_METHODS}
                selectedId={calculationMethod}
                onSelect={(option) => setCalculationMethod(option.id)}
                onClose={() => setMethodPickerVisible(false)}
            />
            <CityPickerSheet
                visible={cityPickerVisible}
                selectedCity={selectedCity}
                usingCurrentLocation={!useManualLocation}
                onSelect={(city) =>
                    setSelectedCity({
                        name: city.name,
                        country: city.country,
                        latitude: city.latitude,
                        longitude: city.longitude,
                    })
                }
                onUseCurrentLocation={handleUseCurrentLocation}
                onClose={() => setCityPickerVisible(false)}
            />
            <PaywallModal
                visible={paywallVisible}
                allowClose
                onClose={() => setPaywallVisible(false)}
                onSuccess={() => setPaywallVisible(false)}
            />
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
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
    prefRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.sm,
    },
    prefText: { flex: 1, paddingRight: theme.spacing.sm },
    prefLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    prefValue: {
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        marginTop: 2,
    },
    legalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.sm,
    },
    legalLabel: {
        fontSize: 15,
        color: "rgba(255,255,255,0.9)",
    },
    linkRow: { flexDirection: "row", alignItems: "center" },
    linkButton: { justifyContent: "flex-start" },
    divider: {
        backgroundColor: glass.borderSubtle,
        marginVertical: theme.spacing.sm,
    },
    footer: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        lineHeight: 18,
    },
    signOutButton: {
        marginTop: theme.spacing.sm,
        borderColor: "#ffcdd2",
    },
});
