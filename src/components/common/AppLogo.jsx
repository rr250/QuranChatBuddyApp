import React from "react";
import { Image, StyleSheet } from "react-native";

export const AppLogo = ({ size = 64, style }) => (
    <Image
        source={require("../../../assets/icon.png")}
        style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }, style]}
        accessibilityLabel="Quran Chat Buddy"
    />
);

const styles = StyleSheet.create({
    logo: {
        resizeMode: "cover",
    },
});
