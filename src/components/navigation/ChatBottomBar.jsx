import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    Pressable,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { glass } from "../../constants/glass";
import { theme } from "../../constants/theme";
import { useChatComposerStore } from "../../store/chatComposerStore";
import { usePaywallAction } from "../../hooks/usePaywallAction";
import { PAYWALL_PLACEMENTS } from "../../constants/paywallConfig";

const MENU_ITEMS = [
    { id: "chat", label: "QCB Chat", icon: "message-text", route: "/(tabs)/chat" },
    { id: "prayer", label: "Prayer Times", icon: "clock-outline", route: "/(tabs)/prayer" },
    { id: "quran", label: "Quran", icon: "book-open-page-variant", route: "/(tabs)/quran" },
    { id: "quiz", label: "Daily Quiz", icon: "head-question", route: "/(tabs)/quiz" },
    { id: "profile", label: "Profile & Settings", icon: "account-cog-outline", route: "/(tabs)/profile" },
];

export const ChatBottomBar = () => {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const [menuVisible, setMenuVisible] = useState(false);
    const { draft, setDraft, queueMessage } = useChatComposerStore();
    const { withPaywallCheck } = usePaywallAction();

    const isChatScreen = pathname?.includes("/chat");
    const bottomPad = Math.max(insets.bottom, 12);

    const handleSubmit = () => {
        const message = draft.trim();
        if (!message) return;

        const submit = () => {
            queueMessage(message);
            if (!isChatScreen) {
                router.push("/(tabs)/chat");
            }
        };

        withPaywallCheck(submit, {
            placement:
                pathname === "/" || pathname?.endsWith("/index")
                    ? PAYWALL_PLACEMENTS.AMA_CLICK
                    : undefined,
        })();
    };

    const navigate = (route) => {
        setMenuVisible(false);
        withPaywallCheck(() => router.push(route))();
    };

    return (
        <>
            <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
                <View style={styles.barRow}>
                    <View style={styles.inputShell}>
                        <MaterialCommunityIcons
                            name="message-text-outline"
                            size={18}
                            color="rgba(255,255,255,0.75)"
                        />
                        <TextInput
                            value={draft}
                            onChangeText={setDraft}
                            placeholder="Ask me anything..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            style={styles.input}
                            returnKeyType="send"
                            onSubmitEditing={handleSubmit}
                            multiline={false}
                        />
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[
                                styles.sendButton,
                                !draft.trim() && styles.sendButtonDisabled,
                            ]}
                            disabled={!draft.trim()}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={18}
                                color={
                                    draft.trim()
                                        ? "#fff"
                                        : "rgba(255,255,255,0.35)"
                                }
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setMenuVisible(true)}
                        accessibilityLabel="Open menu"
                    >
                        <MaterialCommunityIcons
                            name="dots-vertical"
                            size={22}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.overlayDim} />
                    <View style={[styles.menuSheet, { marginBottom: bottomPad + 72 }]}>
                        <Text style={styles.menuTitle}>Explore</Text>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItem}
                                onPress={() => navigate(item.route)}
                            >
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={22}
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        backgroundColor: "rgba(7, 31, 23, 0.96)",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: glass.borderSubtle,
    },
    barRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    inputShell: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255, 255, 255, 0.14)",
        borderRadius: 24,
        paddingHorizontal: 14,
        minHeight: 48,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 15,
        paddingVertical: 8,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    menuButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.14)",
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        paddingHorizontal: theme.spacing.md,
    },
    overlayDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    menuSheet: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderRadius: glass.radiusLg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: glass.border,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.primary,
        marginBottom: theme.spacing.md,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.06)",
    },
    menuLabel: {
        fontSize: 16,
        color: theme.colors.onBackground,
        fontWeight: "500",
    },
});
