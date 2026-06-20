import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { GlassSurface } from "./Glass";
import { theme } from "../../theme";

export const GlassDashboardCard = ({
    onPress,
    children,
    style,
    disabled = false,
}) => {
    const content = (
        <GlassSurface style={[styles.card, style]}>
            <View style={styles.content}>{children}</View>
        </GlassSurface>
    );

    if (!onPress || disabled) return content;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
            {content}
        </TouchableOpacity>
    );
};

export const GlassSection = ({ title, description, children, style }) => (
    <GlassSurface style={[styles.section, style]}>
        <View style={styles.sectionContent}>
            {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
            {description ? (
                <Text style={styles.sectionDesc}>{description}</Text>
            ) : null}
            {children}
        </View>
    </GlassSurface>
);

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
    },
    content: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    sectionContent: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: theme.spacing.xs,
    },
    sectionDesc: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },
});
