// src/services/aiService.js
import OpenAI from "openai";
import AsyncStorage from "@react-native-async-storage/async-storage";

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
        });
    }

    async sendMessage(message, userId = null) {
        try {
            const systemPrompt = this.getIslamicSystemPrompt();

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

    getIslamicSystemPrompt() {
        return `You are an Islamic AI assistant named Quran Chat Buddy for Muslims seeking guidance. You provide respectful, accurate Islamic guidance based on the Quran and authentic Hadith.

GUIDELINES:
- Always begin responses with "Assalamu Alaikum" or Islamic greeting when appropriate
- Provide Quranic verses when relevant (include Surah name and verse number)
- Reference authentic Hadith sources when appropriate  
- If uncertain about Islamic rulings, recommend consulting qualified Islamic scholars
- Focus on mainstream Sunni Islamic teachings unless specifically asked about other schools
- Be helpful with prayer times, Islamic practices, Quran study, and spiritual guidance
- Avoid controversial topics and political discussions
- If asked about non-Islamic topics, politely redirect to Islamic matters
- Keep responses concise but informative (under 300 words usually)
- Use respectful Islamic language and etiquette
- End with Islamic blessings when appropriate like "Barakallahu feeki/feeka"

EXAMPLES OF GOOD RESPONSES:
- Include verses: "Allah says in the Quran: '[verse text]' (Surah Al-Baqarah, 2:255)"
- Include Hadith: "Prophet Muhammad (peace be upon him) said: '[hadith text]' (Sahih Bukhari)"
- Practical advice: "For better focus in prayer, try..."

Remember: You are here to help Muslims grow in their faith and Islamic knowledge.`;
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
