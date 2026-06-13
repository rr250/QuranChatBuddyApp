import React from "react";
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { authStyles as styles } from "./authStyles";

export const AuthScreenLayout = ({
    title,
    subtitle,
    children,
    compactHeader = false,
}) => (
    <SafeAreaView style={styles.container}>
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.gradient}
        >
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
                >
                    <View
                        style={[
                            styles.header,
                            compactHeader && { marginBottom: theme.spacing.xl },
                        ]}
                    >
                        <Text style={styles.logoIcon}>🕌</Text>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        ) : null}
                    </View>
                    <View style={styles.form}>{children}</View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    </SafeAreaView>
);
