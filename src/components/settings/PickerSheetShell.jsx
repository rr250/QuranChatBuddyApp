import React from "react";
import { Modal, View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { glass } from "../../theme";

export const PickerSheetShell = ({
    visible,
    title,
    onClose,
    children,
    scrollable = false,
    maxHeight = "70%",
}) => {
    const body = scrollable ? (
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
        >
            {children}
        </ScrollView>
    ) : (
        children
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.sheet, { maxHeight }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <LinearGradient
                        colors={glass.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.sheetInner}>
                        <View style={styles.handle} />
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <Pressable
                                onPress={onClose}
                                style={styles.closeButton}
                                hitSlop={8}
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={20}
                                    color="rgba(255,255,255,0.85)"
                                />
                            </Pressable>
                        </View>
                        {body}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export const PickerOptionRow = ({
    label,
    subtitle,
    selected,
    onPress,
    showDivider = true,
    leadingIcon = null,
}) => (
    <>
        <Pressable
            style={[styles.row, selected && styles.rowSelected]}
            onPress={onPress}
        >
            {leadingIcon ? (
                <View style={styles.leadingIcon}>{leadingIcon}</View>
            ) : null}
            <View style={styles.rowText}>
                <Text
                    style={[
                        styles.rowLabel,
                        selected && styles.rowLabelSelected,
                    ]}
                >
                    {label}
                </Text>
                {subtitle ? (
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                ) : null}
            </View>
            {selected ? (
                <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={theme.colors.secondary}
                />
            ) : (
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color="rgba(255,255,255,0.45)"
                />
            )}
        </Pressable>
        {showDivider ? <View style={styles.divider} /> : null}
    </>
);

export const pickerSheetStyles = StyleSheet.create({
    listHeader: {
        marginBottom: theme.spacing.xs,
    },
    search: {
        backgroundColor: "rgba(0,0,0,0.22)",
        borderWidth: 1,
        borderColor: glass.borderSubtle,
        borderRadius: glass.radiusSm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        fontSize: 16,
        color: "#fff",
        marginBottom: theme.spacing.sm,
    },
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: glass.darkOverlay,
    },
    sheet: {
        borderTopLeftRadius: glass.radiusLg,
        borderTopRightRadius: glass.radiusLg,
        borderWidth: 1,
        borderColor: glass.cardBorder,
        borderBottomWidth: 0,
        overflow: "hidden",
    },
    sheetInner: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
        paddingTop: theme.spacing.sm,
    },
    scrollContent: {
        paddingBottom: theme.spacing.sm,
    },
    handle: {
        alignSelf: "center",
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: glass.border,
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.md,
        minHeight: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        flex: 1,
    },
    closeButton: {
        position: "absolute",
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundLight,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: glass.radiusSm,
    },
    rowSelected: {
        backgroundColor: glass.backgroundLight,
    },
    rowText: {
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    leadingIcon: {
        marginRight: theme.spacing.sm,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
    },
    rowLabelSelected: {
        fontWeight: "700",
        color: "#fff",
    },
    rowSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: glass.borderSubtle,
        marginLeft: theme.spacing.sm,
    },
});
