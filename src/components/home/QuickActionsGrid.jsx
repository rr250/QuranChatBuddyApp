import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Text, Card } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../constants/theme";

const { width } = Dimensions.get("window");

export const QuickActionsGrid = ({ onAction }) => {
    const quickActions = [
        {
            id: "prayer",
            title: "Prayer Times",
            subtitle: "Salah Schedule",
            icon: "clock-outline",
            gradient: [theme.colors.fajr, theme.colors.dhuhr],
            action: "prayer",
        },
        {
            id: "quran",
            title: "Read Quran",
            subtitle: "Holy Book",
            icon: "book-open-page-variant",
            gradient: [theme.colors.primary, theme.colors.secondary],
            action: "quran",
        },
        {
            id: "quiz",
            title: "Daily Quiz",
            subtitle: "Test Knowledge",
            icon: "head-question",
            gradient: [theme.colors.asr, theme.colors.maghrib],
            action: "quiz",
        },
        {
            id: "qibla",
            title: "Qibla Compass",
            subtitle: "Find Direction",
            icon: "compass-outline",
            gradient: [theme.colors.maghrib, theme.colors.isha],
            action: "prayer",
        },
        {
            id: "dhikr",
            title: "Dhikr Counter",
            subtitle: "Remembrance",
            icon: "counter",
            gradient: [theme.colors.secondary, theme.colors.primary],
            action: "dhikr",
        },
        {
            id: "chat",
            title: "AI Islamic Guide",
            subtitle: "Ask Questions",
            icon: "robot",
            gradient: [theme.colors.primary, theme.colors.primaryContainer],
            action: "chat",
        },
    ];

    const handleActionPress = (action) => {
        if (onAction) {
            onAction(action);
        }
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <MaterialCommunityIcons
                        name="lightning-bolt"
                        size={24}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.title}>Quick Actions</Text>
                </View>

                <View style={styles.grid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.actionItem}
                            onPress={() => handleActionPress(action.action)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={action.gradient}
                                style={styles.actionGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.iconContainer}>
                                    <MaterialCommunityIcons
                                        name={action.icon}
                                        size={32}
                                        color="white"
                                    />
                                </View>
                                <Text style={styles.actionTitle}>
                                    {action.title}
                                </Text>
                                <Text style={styles.actionSubtitle}>
                                    {action.subtitle}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: theme.spacing.sm,
        color: theme.colors.onSurface,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    actionItem: {
        width: (width - theme.spacing.md * 5) / 2,
        marginBottom: theme.spacing.md,
        borderRadius: theme.spacing.md,
        overflow: "hidden",
        elevation: 3,
    },
    actionGradient: {
        padding: theme.spacing.lg,
        alignItems: "center",
        minHeight: 120,
        justifyContent: "center",
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginBottom: theme.spacing.xs,
    },
    actionSubtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
});
