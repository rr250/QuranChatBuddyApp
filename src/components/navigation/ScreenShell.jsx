import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBackground } from "../ui/Glass";
import { ScreenHeader } from "../navigation/ScreenHeader";
import { theme } from "../../theme";

export const ScreenShell = ({
    title,
    subtitle,
    showHome = true,
    rightAction,
    children,
    contentStyle,
}) => (
    <AppBackground>
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScreenHeader
                title={title}
                subtitle={subtitle}
                showHome={showHome}
                rightAction={rightAction}
            />
            <View style={[styles.content, contentStyle]}>{children}</View>
        </SafeAreaView>
    </AppBackground>
);

export const screenContentPadding = {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
});
