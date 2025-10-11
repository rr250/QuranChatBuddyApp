import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, StatusBar } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../src/constants/theme";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
    useEffect(() => {
        // Auto-navigate after showing welcome for a moment
        const timer = setTimeout(() => {
            // Auto-navigate can be removed if you want user to choose
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>🕌</Text>
                        <Text style={styles.appName}>Quran Chat Buddy</Text>
                        <Text style={styles.tagline}>
                            Your AI Islamic Companion
                        </Text>
                    </View>

                    {/* Features Section */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.feature}>
                            <Text style={styles.featureIcon}>📖</Text>
                            <Text style={styles.featureText}>
                                Read & Listen to Quran
                            </Text>
                        </View>
                        <View style={styles.feature}>
                            <Text style={styles.featureIcon}>🕐</Text>
                            <Text style={styles.featureText}>
                                Prayer Times & Reminders
                            </Text>
                        </View>
                        <View style={styles.feature}>
                            <Text style={styles.featureIcon}>🧠</Text>
                            <Text style={styles.featureText}>
                                Daily Islamic Quiz
                            </Text>
                        </View>
                        <View style={styles.feature}>
                            <Text style={styles.featureIcon}>🤖</Text>
                            <Text style={styles.featureText}>
                                AI Islamic Guidance
                            </Text>
                        </View>
                    </View>

                    {/* Buttons Section */}
                    <View style={styles.buttonsContainer}>
                        <Button
                            mode="contained"
                            onPress={() => router.push("/(auth)/register")}
                            style={styles.primaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            Get Started
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={() => router.push("/(auth)/login")}
                            style={styles.secondaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={[
                                styles.buttonLabel,
                                styles.secondaryButtonLabel,
                            ]}
                        >
                            Sign In
                        </Button>

                        <View style={styles.islamicPattern}>
                            <Text style={styles.pattern}>✦ ◈ ✧ ◈ ✦</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
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
        marginTop: -theme.spacing.xxl,
    },
    logoIcon: {
        fontSize: 100,
        marginBottom: theme.spacing.lg,
    },
    appName: {
        fontSize: 36,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
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
        marginVertical: theme.spacing.xl,
    },
    feature: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: theme.spacing.md,
    },
    featureText: {
        fontSize: 16,
        color: "white",
        fontWeight: "500",
    },
    buttonsContainer: {
        paddingBottom: theme.spacing.lg,
    },
    primaryButton: {
        backgroundColor: "white",
        marginBottom: theme.spacing.md,
        borderRadius: theme.spacing.md,
    },
    secondaryButton: {
        borderColor: "white",
        borderWidth: 1,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.spacing.md,
    },
    buttonContent: {
        paddingVertical: theme.spacing.sm,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    secondaryButtonLabel: {
        color: "white",
    },
    islamicPattern: {
        alignItems: "center",
        paddingTop: theme.spacing.lg,
    },
    pattern: {
        fontSize: 20,
        color: "rgba(255,255,255,0.7)",
        letterSpacing: 8,
    },
});
