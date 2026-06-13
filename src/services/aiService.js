import OpenAI from "openai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from "firebase/database";
import { getIslamicSystemPrompt } from "../constants/ai";
import { BaseService } from "./baseService";

class AIService extends BaseService {
    constructor() {
        super();
        this.openai = new OpenAI({
            apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
        });
        this.initialize();
    }

    async getOnboardingData() {
        try {
            const onboardingRef = ref(
                this.database,
                this.getUserPath("profile/onboarding"),
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
            const onboardingData = await this.getOnboardingData();
            const systemPrompt = getIslamicSystemPrompt({ onboardingData });
            const conversationHistory = await this.getConversationHistory(userId);

            const messages = [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: message },
            ];

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages,
                max_tokens: 800,
                temperature: 0.7,
                presence_penalty: 0.1,
                frequency_penalty: 0.1,
            });

            const aiResponse = completion.choices[0].message.content;
            await this.saveMessageToHistory(userId, message, aiResponse);
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
            await AsyncStorage.removeItem(`conversation_${userId}`);
        } catch (error) {
            console.error("Error clearing conversation history:", error);
        }
    }
}

export const aiService = new AIService();
