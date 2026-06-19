import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppBackground, GlassSurface } from "../../src/components/ui/Glass";
import { AppLogo } from "../../src/components/common/AppLogo";
import { theme } from "../../src/constants/theme";

const FEATURES = [
    { icon: "book-open-page-variant", text: "Read & Listen to Quran" },
    { icon: "clock-outline", text: "Prayer Times & Reminders" },
    { icon: "head-question", text: "Daily Islamic Quiz" },
    { icon: "message-text-outline", text: "Islamic Guidance" },
];

export default function WelcomeScreen() {
    return (
        <AppBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <AppLogo size={96} />
                        <Text style={styles.appName}>Quran Chat Buddy</Text>
                        <Text style={styles.tagline}>
                            Your Islamic Companion
                        </Text>
                    </View>

                    <View style={styles.featuresContainer}>
                        {FEATURES.map((feature) => (
                            <GlassSurface
                                key={feature.text}
                                style={styles.featureCard}
                            >
                                <View style={styles.featureRow}>
                                    <MaterialCommunityIcons
                                        name={feature.icon}
                                        size={24}
                                        color="#fff"
                                    />
                                    <Text style={styles.featureText}>
                                        {feature.text}
                                    </Text>
                                </View>
                            </GlassSurface>
                        ))}
                    </View>

                    <View style={styles.buttonsContainer}>
                        <Button
                            mode="contained"
                            onPress={() => router.push("/(auth)/register")}
                            style={styles.primaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                            buttonColor="#fff"
                            textColor={theme.colors.primary}
                        >
                            Get Started
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => router.push("/(auth)/login")}
                            style={styles.secondaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.secondaryButtonLabel}
                            textColor="#fff"
                        >
                            Sign In
                        </Button>
                    </View>
                </View>
            </SafeAreaView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        justifyContent: "space-between",
        paddingVertical: theme.spacing.xxl,
    },
    logoContainer: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
    },
    appName: {
        fontSize: 34,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    tagline: {
        fontSize: 18,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        fontWeight: "300",
    },
    featuresContainer: {
        flex: 1,
        justifyContent: "center",
        gap: theme.spacing.sm,
        marginVertical: theme.spacing.xl,
    },
    featureCard: {
        marginBottom: theme.spacing.xs,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    featureText: {
        fontSize: 16,
        color: "white",
        fontWeight: "500",
        flex: 1,
    },
    buttonsContainer: {
        paddingBottom: theme.spacing.lg,
    },
    primaryButton: {
        marginBottom: theme.spacing.md,
        borderRadius: theme.spacing.md,
    },
    secondaryButton: {
        borderColor: "rgba(255,255,255,0.7)",
        borderWidth: 1,
        borderRadius: theme.spacing.md,
    },
    buttonContent: {
        paddingVertical: theme.spacing.sm,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "bold",
    },
    secondaryButtonLabel: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
