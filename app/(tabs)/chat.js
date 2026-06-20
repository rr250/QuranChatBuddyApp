import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "../../src/hooks/useChat";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { theme, spacing } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { usePremiumGate } from "../../src/hooks/usePremiumGate";
import { PaywallModal } from "../../src/components/subscription/PaywallModal";
import { useChatComposerStore } from "../../src/store/chatComposerStore";
import { AppBackground } from "../../src/components/ui/Glass";
import { AppLogo } from "../../src/components/common/AppLogo";
import { ScreenHeader } from "../../src/components/navigation/ScreenHeader";
import { glass } from "../../src/constants/glass";
import { CHAT_BOTTOM_BAR_HEIGHT } from "../../src/constants/layout";
import { AuthService } from "../../src/services/authService";
import { MessageUsageService } from "../../src/services/messageUsageService";

export default function ChatScreen() {
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [usageCount, setUsageCount] = useState(0);
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const pendingMessage = useChatComposerStore((s) => s.pendingMessage);
    const consumePendingMessage = useChatComposerStore(
        (s) => s.consumePendingMessage,
    );
    const queueMessage = useChatComposerStore((s) => s.queueMessage);
    const {
        messages,
        sendMessage,
        loading,
        error,
        clearChat,
        loadChatHistory,
        historyLoaded,
    } = useChat(user?.uid ?? "guest");
    const { isPremium, canAccess, remainingFree } = usePremiumGate(usageCount);
    const flatListRef = useRef(null);
    const processingRef = useRef(false);
    const pendingHandledRef = useRef(false);

    const listBottomPadding =
        CHAT_BOTTOM_BAR_HEIGHT + insets.bottom + spacing.lg;

    const scrollToLatest = useCallback(() => {
        requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        });
    }, []);

    useEffect(() => {
        let alive = true;

        const bootstrap = async () => {
            try {
                const authUser = await AuthService.ensureAuthenticated();
                if (authUser?.uid) {
                    useAuthStore.getState().setUser(authUser);
                }

                const uid = authUser?.uid ?? user?.uid ?? "guest";
                const count = await MessageUsageService.getCount(uid);
                if (alive) {
                    setUsageCount(count);
                }
                await loadChatHistory();
            } catch (error) {
                if (error?.code === "device-restore-unavailable") {
                    console.warn("Chat bootstrap:", error.message);
                } else {
                    console.warn("Chat bootstrap failed:", error);
                }
                await loadChatHistory();
            }
        };

        bootstrap();

        return () => {
            alive = false;
        };
    }, [loadChatHistory, user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;

        MessageUsageService.getCount(user.uid).then(setUsageCount).catch(() => {});
    }, [user?.uid]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToLatest();
        }
    }, [messages, loading, error, scrollToLatest]);

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", scrollToLatest);
        return () => showSub.remove();
    }, [scrollToLatest]);

    const submitMessage = useCallback(
        async (text) => {
            const trimmed = text?.trim();
            if (!trimmed || loading || processingRef.current) return false;

            if (!canAccess) {
                setPaywallVisible(true);
                return false;
            }

            processingRef.current = true;
            try {
                await sendMessage(trimmed);
                const uid = user?.uid ?? "guest";
                const newCount = await MessageUsageService.getCount(uid);
                setUsageCount(newCount);
                return true;
            } catch (error) {
                if (error?.code === "free-limit-reached") {
                    setPaywallVisible(true);
                    return false;
                }
                throw error;
            } finally {
                processingRef.current = false;
            }
        },
        [canAccess, loading, sendMessage, user?.uid],
    );

    useEffect(() => {
        if (!historyLoaded || !pendingMessage || pendingHandledRef.current) {
            return;
        }

        pendingHandledRef.current = true;
        submitMessage(pendingMessage)
            .then((sent) => {
                if (sent) {
                    consumePendingMessage();
                }
            })
            .finally(() => {
                pendingHandledRef.current = false;
            });
    }, [historyLoaded, pendingMessage, submitMessage, consumePendingMessage]);

    const handleClearChat = () => {
        Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
            { text: "Cancel", style: "cancel" },
            { text: "Clear", style: "destructive", onPress: clearChat },
        ]);
    };

    const quickQuestions = [
        "What are the 5 pillars of Islam?",
        "How do I perform Wudu?",
        "Tell me about Surah Al-Fatiha",
        "What is the importance of prayer?",
    ];

    const renderListFooter = () => (
        <View>
            {loading ? (
                <View style={styles.typingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.typingText}>Thinking...</Text>
                </View>
            ) : null}

            {messages.length <= 1
                ? quickQuestions.map((question) => (
                      <TouchableOpacity
                          key={question}
                          style={styles.quickQuestionButton}
                          onPress={() => queueMessage(question)}
                      >
                          <Text style={styles.quickQuestionText}>{question}</Text>
                      </TouchableOpacity>
                  ))
                : null}

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {!isPremium && canAccess ? (
                <View style={styles.premiumBanner}>
                    <Text style={styles.premiumBannerText}>
                        {remainingFree} free messages left —{" "}
                        <Text
                            style={styles.premiumLink}
                            onPress={() => setPaywallVisible(true)}
                        >
                            Upgrade
                        </Text>
                    </Text>
                </View>
            ) : null}
        </View>
    );

    return (
        <AppBackground>
            <SafeAreaView style={styles.container} edges={["top"]}>
                <ScreenHeader
                    title="QCB Chat"
                    subtitle="Your Islamic companion"
                    rightAction={
                        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    }
                />

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={[
                        styles.messagesContainer,
                        { paddingBottom: listBottomPadding },
                        messages.length === 0 && styles.emptyContainer,
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={scrollToLatest}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <AppLogo size={56} />
                            <Text style={styles.emptyStateTitle}>Welcome</Text>
                            <Text style={styles.emptyStateText}>
                                Ask about Quranic verses, prayer, hadith, or spiritual guidance.
                                Use the bar below to start a conversation.
                            </Text>
                        </View>
                    }
                    ListFooterComponent={renderListFooter}
                />

                <PaywallModal
                    visible={paywallVisible}
                    allowClose
                    onClose={() => setPaywallVisible(false)}
                    onSuccess={() => setPaywallVisible(false)}
                />
            </SafeAreaView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    messagesList: { flex: 1 },
    messagesContainer: { padding: spacing.md, flexGrow: 1 },
    emptyContainer: { justifyContent: "center", flex: 1 },
    emptyState: { alignItems: "center", paddingHorizontal: spacing.lg },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        marginBottom: spacing.md,
    },
    emptyStateText: {
        fontSize: 15,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 22,
    },
    typingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: spacing.md,
    },
    typingText: { color: "rgba(255,255,255,0.8)" },
    quickQuestionButton: {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    quickQuestionText: { color: "#fff", fontSize: 14 },
    errorContainer: {
        marginHorizontal: spacing.md,
        padding: spacing.sm,
        backgroundColor: "rgba(255,205,210,0.2)",
        borderRadius: 12,
    },
    errorText: { color: "#ffcdd2", textAlign: "center" },
    premiumBanner: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.sm,
        backgroundColor: glass.backgroundLight,
        borderRadius: 12,
    },
    premiumBannerText: { color: "rgba(255,255,255,0.85)", textAlign: "center" },
    premiumLink: { color: theme.colors.secondary, fontWeight: "700" },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    clearButtonText: { color: "#fff", fontWeight: "600" },
});
