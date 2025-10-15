// src/hooks/useChat.js
import { useState, useCallback } from "react";
import { aiService } from "../services/aiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useChat = (userId = "default_user") => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load chat history when hook initializes
    const loadChatHistory = useCallback(async () => {
        try {
            const historyKey = `chat_messages_${userId}`;
            const savedMessages = await AsyncStorage.getItem(historyKey);
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            } else {
                // Add welcome message for new users
                const welcomeMessage = {
                    id: Date.now().toString(),
                    text: "Assalamu Alaikum! Welcome to your Quran Chat Buddy. I'm here to help you with questions about Islam, prayer times, Quran verses, and spiritual guidance. How may I assist you today?",
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    }, [userId]);

    // Save messages to local storage
    const saveMessages = async (newMessages) => {
        try {
            const historyKey = `chat_messages_${userId}`;
            await AsyncStorage.setItem(historyKey, JSON.stringify(newMessages));
        } catch (error) {
            console.error("Error saving messages:", error);
        }
    };

    const sendMessage = useCallback(
        async (text) => {
            if (!text.trim()) return;

            const userMessage = {
                id: Date.now().toString(),
                text: text.trim(),
                isUser: true,
                timestamp: new Date(),
            };

            // Add user message immediately
            const messagesWithUser = [...messages, userMessage];
            setMessages(messagesWithUser);
            setLoading(true);
            setError(null);

            try {
                // Get AI response
                const aiResponse = await aiService.sendMessage(text, userId);

                const aiMessage = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date(),
                };

                const allMessages = [...messagesWithUser, aiMessage];
                setMessages(allMessages);

                // Save to storage
                await saveMessages(allMessages);
            } catch (error) {
                console.error("Error sending message:", error);
                setError(
                    "Sorry, I could not process your request. Please check your internet connection and try again."
                );

                const errorMessage = {
                    id: (Date.now() + 1).toString(),
                    text: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, remember that Allah is always with you.",
                    isUser: false,
                    timestamp: new Date(),
                    isError: true,
                };

                const messagesWithError = [...messagesWithUser, errorMessage];
                setMessages(messagesWithError);
                await saveMessages(messagesWithError);
            } finally {
                setLoading(false);
            }
        },
        [messages, userId]
    );

    const clearChat = useCallback(async () => {
        try {
            const historyKey = `chat_messages_${userId}`;
            await AsyncStorage.removeItem(historyKey);
            await aiService.clearConversationHistory(userId);

            // Add welcome message
            const welcomeMessage = {
                id: Date.now().toString(),
                text: "Assalamu Alaikum! How may I assist you today?",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            setError(null);
        } catch (error) {
            console.error("Error clearing chat:", error);
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
