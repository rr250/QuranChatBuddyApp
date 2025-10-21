// src/services/aiService.js
import OpenAI from "openai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getIslamicSystemPrompt } from "../constants/ai";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import {
    ref,
    set,
    get,
    push,
    query,
    orderByKey,
    limitToLast,
    serverTimestamp,
} from "firebase/database";
import { AuthService } from "./authService";

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
        });
        this.initialize();
    }

    initialize() {
        if (!this.auth) {
            this.auth = getFirebaseAuth();
            this.database = getFirebaseDatabase();
        }
    }

    getCurrentUserId() {
        AuthService.initialize(); // Ensure AuthService is initialized
        const user = AuthService.getCurrentUser();
        if (!user) {
            throw new Error("User not authenticated");
        }
        console.log("Current User ID:", user.uid);
        return user.uid;
    }

    // Get Firebase path for user data
    getUserPath(path = "") {
        const userId = this.getCurrentUserId();
        return `users/${userId}/${path}`;
    }

    async getOnboardingData() {
        try {
            const onboardingRef = ref(
                this.database,
                this.getUserPath("/profile/onboarding")
            );
            const snapshot = await get(onboardingRef);
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error("Error fetching onboarding data:", error);
            return null;
        }
    }

    async sendMessage(message) {
        try {
            const userId = this.getCurrentUserId();

            // Fetch onboarding data for personalized prompt
            const onboardingData = await this.getOnboardingData();
            console.log("Onboarding Data:", onboardingData);

            const systemPrompt = getIslamicSystemPrompt({ onboardingData });
            console.log("System Prompt:", systemPrompt);

            // Get conversation history for context (optional)
            const conversationHistory = await this.getConversationHistory(
                userId
            );

            const messages = [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: message },
            ];

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: messages,
                max_tokens: 800,
                temperature: 0.7,
                presence_penalty: 0.1,
                frequency_penalty: 0.1,
            });

            const aiResponse = completion.choices[0].message.content;

            // Save conversation history
            if (userId) {
                await this.saveMessageToHistory(userId, message, aiResponse);
            }

            return aiResponse;
        } catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("Failed to get AI response. Please try again.");
        }
    }

    async getConversationHistory(userId) {
        if (!userId) return [];

        try {
            const historyKey = `conversation_${userId}`;
            const history = await AsyncStorage.getItem(historyKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error("Error loading conversation history:", error);
            return [];
        }
    }

    async saveMessageToHistory(userId, userMessage, aiResponse) {
        try {
            const historyKey = `conversation_${userId}`;
            const history = await this.getConversationHistory(userId);

            // Keep only last 6 messages for context (3 user + 3 AI)
            const newHistory = [
                ...history.slice(-6),
                { role: "user", content: userMessage },
                { role: "assistant", content: aiResponse },
            ];

            await AsyncStorage.setItem(historyKey, JSON.stringify(newHistory));
        } catch (error) {
            console.error("Error saving conversation history:", error);
        }
    }

    async clearConversationHistory(userId) {
        try {
            const historyKey = `conversation_${userId}`;
            await AsyncStorage.removeItem(historyKey);
        } catch (error) {
            console.error("Error clearing conversation history:", error);
        }
    }
}

export const aiService = new AIService();
