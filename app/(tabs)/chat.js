// app/(tabs)/chat.js  (rename from chat.tsx)
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "../../src/hooks/useChat";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
// import { LoadingSpinner } from "../../src/components/common/LoadingSpinner";
import { colors, spacing, typography } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";

export default function ChatScreen() {
    const [inputText, setInputText] = useState("");
    const { user } = useAuthStore();
    const {
        messages,
        sendMessage,
        loading,
        error,
        clearChat,
        loadChatHistory,
    } = useChat(user?.uid);
    const flatListRef = useRef(null);

    // Load chat history when screen mounts
    useEffect(() => {
        loadChatHistory();
    }, []);

    // Auto scroll to bottom when new message is added
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (inputText.trim()) {
            await sendMessage(inputText.trim());
            setInputText("");
        }
    };

    const handleClearChat = () => {
        Alert.alert(
            "Clear Chat",
            "Are you sure you want to clear all messages?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: clearChat,
                },
            ]
        );
    };

    const renderMessage = ({ item }) => <MessageBubble message={item} />;

    const renderHeader = () => (
        <LinearGradient
            colors={[
                colors?.primary || "#2E8B57",
                colors?.primaryDark || "#1F5F3F",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <View>
                    <Text style={styles.headerTitle}>Quran Chat Buddy</Text>
                    <Text style={styles.headerSubtitle}>
                        Ask me anything about Islam
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleClearChat}
                    style={styles.clearButton}
                >
                    <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderTypingIndicator = () => {
        if (!loading) return null;

        return (
            <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.typingText}>Thinking...</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
                🕌 Welcome to Quran Chat Buddy
            </Text>
            <Text style={styles.emptyStateText}>
                I can help you with:
                {"\n"}• Quranic verses and interpretations
                {"\n"}• Islamic practices and rituals
                {"\n"}• Prayer guidance and timings
                {"\n"}• Hadith explanations
                {"\n"}• Spiritual advice and guidance
            </Text>
        </View>
    );

    const quickQuestions = [
        "What are the 5 pillars of Islam?",
        "How do I perform Wudu?",
        "Tell me about Surah Al-Fatiha",
        "What is the importance of prayer?",
    ];

    const renderQuickQuestions = () => (
        <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            {quickQuestions.map((question, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.quickQuestionButton}
                    onPress={() => setInputText(question)}
                >
                    <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={[
                    styles.messagesContainer,
                    messages.length === 0 && styles.emptyContainer,
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderTypingIndicator}
            />

            {messages.length <= 1 && renderQuickQuestions()}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.inputContainer}
            >
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask about Islam, prayers, Quran..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || loading) &&
                                styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || loading}
                    >
                        <Text style={styles.sendButtonText}>
                            {loading ? "..." : "Send"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingVertical: spacing?.lg || 20,
        paddingHorizontal: spacing?.md || 16,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    clearButton: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    clearButtonText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        paddingVertical: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
    },
    emptyState: {
        alignItems: "center",
        padding: 32,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },
    emptyStateText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
    },
    quickQuestionsContainer: {
        padding: 16,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    quickQuestionsTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#666",
        marginBottom: 8,
    },
    quickQuestionButton: {
        backgroundColor: "#f0f0f0",
        padding: 10,
        borderRadius: 8,
        marginVertical: 2,
    },
    quickQuestionText: {
        fontSize: 14,
        color: "#333",
    },
    typingContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        alignSelf: "flex-start",
        maxWidth: "70%",
    },
    typingText: {
        marginLeft: 8,
        fontSize: 14,
        color: "#666",
        fontStyle: "italic",
    },
    errorContainer: {
        backgroundColor: "#ffebee",
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ffcdd2",
    },
    errorText: {
        color: "#d32f2f",
        fontSize: 14,
        textAlign: "center",
    },
    inputContainer: {
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    inputRow: {
        flexDirection: "row",
        padding: 16,
        alignItems: "flex-end",
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 12,
        backgroundColor: "#fafafa",
    },
    sendButton: {
        backgroundColor: colors?.primary || "#2E8B57",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 60,
        alignItems: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
});
