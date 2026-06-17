// src/hooks/useChat.js
import { useState, useCallback } from "react";
import { aiService } from "../services/aiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const saveMessages = useCallback(
        async (newMessages) => {
            try {
                const historyKey = `chat_messages_${userId}`;
                await AsyncStorage.setItem(
                    historyKey,
                    JSON.stringify(newMessages),
                );
            } catch (err) {
                console.error("Error saving messages:", err);
            }
        },
        [userId],
    );

    const loadChatHistory = useCallback(async () => {
        try {
            const historyKey = `chat_messages_${userId}`;
            const savedMessages = await AsyncStorage.getItem(historyKey);
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            } else {
                setMessages([createWelcomeMessage()]);
            }
        } catch (err) {
            console.error("Error loading chat history:", err);
        }
    }, [userId]);

    const sendMessage = useCallback(
        async (text) => {
            if (!text.trim()) return;

            const userMessage = {
                id: Date.now().toString(),
                text: text.trim(),
                isUser: true,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setLoading(true);
            setError(null);

            try {
                const aiResponse = await aiService.sendMessage(text.trim());

                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date(),
                };

                setMessages((prev) => {
                    const allMessages = [...prev, aiMessage];
                    saveMessages(allMessages);
                    return allMessages;
                });
            } catch (err) {
                console.error("Error sending message:", err);
                setError(
                    "Sorry, I could not process your request. Please check your internet connection and try again.",
                );

                const errorMessage = {
                    id: (Date.now() + 1).toString(),
                    text: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, remember that Allah is always with you.",
                    isUser: false,
                    timestamp: new Date(),
                    isError: true,
                };

                setMessages((prev) => {
                    const messagesWithError = [...prev, errorMessage];
                    saveMessages(messagesWithError);
                    return messagesWithError;
                });
            } finally {
                setLoading(false);
            }
        },
        [saveMessages],
    );

    const clearChat = useCallback(async () => {
        try {
            const historyKey = `chat_messages_${userId}`;
            await AsyncStorage.removeItem(historyKey);
            await aiService.clearConversationHistory(userId);

            const welcomeMessage = {
                id: Date.now().toString(),
                text: "Assalamu Alaikum! How may I assist you today?",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            setError(null);
        } catch (err) {
            console.error("Error clearing chat:", err);
        }
    }, [userId]);

    return {
        messages,
        sendMessage,
        loading,
        error,
        clearChat,
        loadChatHistory,
    };
};
