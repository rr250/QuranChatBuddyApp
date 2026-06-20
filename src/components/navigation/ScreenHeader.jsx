import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { glass, theme } from "../../theme";

export const ScreenHeader = ({
    title,
    subtitle,
    showHome = true,
    leftAction,
    rightAction,
}) => (
    <View style={styles.header}>
        <View style={styles.left}>
            {leftAction ?? null}
            {showHome ? (
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push("/(tabs)")}
                >
                    <MaterialCommunityIcons name="home-variant" size={20} color={theme.colors.onPrimary} />
                </TouchableOpacity>
            ) : null}
            <View>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
        {rightAction ?? null}
    </View>
);

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        flex: 1,
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: theme.colors.onPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: glass.border,
        marginTop: 2,
    },
});
