import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, ActivityIndicator } from "react-native-paper";
import { theme } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

export const LoadingScreen = () => {
    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🕌</Text>
                </View>

                <Text style={styles.appName}>Quran Chat Buddy</Text>
                <Text style={styles.tagline}>
                    Loading your Islamic companion...
                </Text>

                <ActivityIndicator
                    size="large"
                    color="white"
                    style={styles.loader}
                />

                <View style={styles.dotsContainer}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        justifyContent: "center",
    },
    logoContainer: {
        marginBottom: theme.spacing.xl,
    },
    logoIcon: {
        fontSize: 80,
    },
    appName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: theme.spacing.sm,
        textAlign: "center",
    },
    tagline: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        marginBottom: theme.spacing.xl,
    },
    loader: {
        marginBottom: theme.spacing.lg,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "white",
        marginHorizontal: 4,
        opacity: 0.6,
    },
    dot1: {
        opacity: 0.8,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 0.4,
    },
});
