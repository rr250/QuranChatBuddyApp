import { useState, useCallback, useEffect } from "react";
import { aiService } from "../services/aiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "../services/logger";

const createWelcomeMessage = () => ({
    id: Date.now().toString(),
    text: "Assalamu Alaikum! Welcome to your Quran Chat Buddy. I'm here to help you with questions about Islam, prayer times, Quran verses, and spiritual guidance. How may I assist you today?",
    isUser: false,
    timestamp: new Date(),
});

export const useChat = (userId = "default_user") => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    useEffect(() => {
        setHistoryLoaded(false);
    }, [userId]);

    const saveMessages = useCallback(
        async (newMessages) => {
            try {
                await AsyncStorage.setItem(
                    `chat_messages_${userId}`,
                    JSON.stringify(newMessages),
                );
            } catch (err) {
                logger.error("Error saving messages:", err);
            }
        },
        [userId],
    );

    const loadChatHistory = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(`chat_messages_${userId}`);
            setMessages(saved ? JSON.parse(saved) : [createWelcomeMessage()]);
        } catch (err) {
            logger.error("Error loading chat history:", err);
            setMessages([createWelcomeMessage()]);
        } finally {
            setHistoryLoaded(true);
        }
    }, [userId]);

    const sendMessage = useCallback(
        async (text) => {
            const trimmed = text?.trim();
            if (!trimmed) return;

            const userMessage = {
                id: Date.now().toString(),
                text: trimmed,
                isUser: true,
                timestamp: new Date(),
            };

            setMessages((prev) => {
                const updated = [...prev, userMessage];
                saveMessages(updated);
                return updated;
            });
            setLoading(true);
            setError(null);

            try {
                const aiResponse = await aiService.sendMessage(trimmed);

                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date(),
                    animate: true,
                };

                setMessages((prev) => {
                    const all = [...prev, aiMessage];
                    saveMessages(all);
                    return all;
                });
            } catch (err) {
                if (err?.code === "free-limit-reached") {
                    throw err;
                }
                logger.error("Error sending message:", err);
                setError(
                    "Sorry, I could not process your request. Please check your internet connection and try again.",
                );

                const errorMessage = {
                    id: (Date.now() + 1).toString(),
                    text: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
                    isUser: false,
                    timestamp: new Date(),
                    isError: true,
                };

                setMessages((prev) => {
                    const withError = [...prev, errorMessage];
                    saveMessages(withError);
                    return withError;
                });
            } finally {
                setLoading(false);
            }
        },
        [saveMessages],
    );

    const clearChat = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(`chat_messages_${userId}`);
            await aiService.clearConversationHistory(userId);
            setMessages([
                {
                    id: Date.now().toString(),
                    text: "Assalamu Alaikum! How may I assist you today?",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
            setError(null);
        } catch (err) {
            logger.error("Error clearing chat:", err);
        }
    }, [userId]);

    return {
        messages,
        sendMessage,
        loading,
        error,
        clearChat,
        loadChatHistory,
        historyLoaded,
    };
};
