import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { glass, gradients } from "../../theme";

export const AppBackground = ({ children, style }) => (
    <View style={[styles.root, style]}>
        <LinearGradient
            colors={gradients.mesh}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        {children}
    </View>
);

/** Solid inviting green surface — matches user chat bubble style */
export const GlassSurface = ({ children, style, contentStyle }) => (
    <View style={[styles.surface, style]}>
        <LinearGradient
            colors={glass.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
        />
        <View style={[styles.surfaceContent, contentStyle]}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#071F17",
    },
    glowTop: {
        position: "absolute",
        top: -80,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(74, 155, 127, 0.22)",
    },
    glowBottom: {
        position: "absolute",
        bottom: 120,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(212, 168, 75, 0.14)",
    },
    surface: {
        overflow: "hidden",
        borderRadius: glass.radius,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    surfaceContent: {
        padding: 0,
    },
});
