import React from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBackground } from "../ui/Glass";
import { AppLogo } from "./AppLogo";
import { theme } from "../../theme";

export const LoadingScreen = () => (
    <AppBackground>
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <AppLogo size={88} />
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
        </SafeAreaView>
    </AppBackground>
);

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
    appName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginTop: theme.spacing.lg,
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
