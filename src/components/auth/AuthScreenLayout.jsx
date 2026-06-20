import React from "react";
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppBackground, GlassSurface } from "../ui/Glass";
import { AppLogo } from "../common/AppLogo";
import { theme } from "../../theme";
import { glass } from "../../theme";

export const AuthScreenLayout = ({
    title,
    subtitle,
    children,
    compactHeader = false,
    showHomeButton = false,
}) => (
    <AppBackground>
        <SafeAreaView style={styles.container} edges={["top"]}>
            {showHomeButton ? (
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => router.push("/(tabs)")}
                    accessibilityLabel="Go to home"
                >
                    <MaterialCommunityIcons
                        name="home-variant"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>
            ) : null}
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        compactHeader && { paddingVertical: theme.spacing.lg },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.header,
                            compactHeader && { marginBottom: theme.spacing.xl },
                        ]}
                    >
                        <AppLogo size={72} />
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        ) : null}
                    </View>
                    <GlassSurface style={styles.formCard}>
                        <View style={styles.form}>{children}</View>
                    </GlassSurface>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    </AppBackground>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    homeButton: {
        position: "absolute",
        top: theme.spacing.md,
        left: theme.spacing.md,
        zIndex: 2,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    keyboardContainer: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    header: {
        alignItems: "center",
        marginBottom: theme.spacing.xl,
        paddingTop: theme.spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    formCard: {
        marginBottom: theme.spacing.xl,
    },
    form: {
        padding: theme.spacing.lg,
    },
});
