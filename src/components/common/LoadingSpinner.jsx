import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../theme";

export const LoadingSpinner = ({
    size = "large",
    color = colors.primary,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
});
