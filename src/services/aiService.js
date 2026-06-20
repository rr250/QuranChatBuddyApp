import { httpsCallable } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from "firebase/database";
import { getIslamicSystemPrompt } from "../constants/ai";
import { BaseService } from "./baseService";
import { getFirebaseFunctions } from "./firebase";
import { AuthService } from "./authService";
import { DeviceIdentityService } from "./deviceIdentityService";
import { MessageUsageService } from "./messageUsageService";

const LOG_PREFIX = "[AI Service]";

class AIService extends BaseService {
    constructor() {
        super();
        this.initialize();
    }

    async callCloudFunction(name, data) {
        console.log(`${LOG_PREFIX} Calling Firebase function: ${name}`);
        try {
            await AuthService.ensureAuthenticated();
            const functions = getFirebaseFunctions();
            const callable = httpsCallable(functions, name);
            const result = await callable(data);
            const content = result.data?.content ?? "";
            console.log(`${LOG_PREFIX} Firebase response received (${name})`, {
                source: "firebase-functions",
                contentLength: content.length,
                preview: content.slice(0, 120),
            });
            return result.data;
        } catch (error) {
            console.warn(`${LOG_PREFIX} Firebase call failed (${name}):`, error);
            if (error?.code === "functions/resource-exhausted") {
                const quotaError = new Error(
                    "You have used all free messages. Upgrade to continue.",
                );
                quotaError.code = "free-limit-reached";
                throw quotaError;
            }
            if (error?.code === "functions/failed-precondition") {
                throw new Error(
                    error.message ||
                        "AI service is not configured on the server.",
                );
            }
            if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
                console.warn(
                    `${LOG_PREFIX} Falling back to direct OpenAI`,
                );
                return this.callOpenAIDirect(name, data);
            }
            throw error;
        }
    }

    async callOpenAIDirect(name, data) {
        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API key not configured");
        }

        if (name === "verseCategory") {
            const { translation, reference } = data;
            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Categorize Quran verses with a short Islamic theme label (2-4 words). Examples: Trust in Allah, Patience, Gratitude, Mercy. Reply with only the label, no quotes or punctuation.",
                            },
                            {
                                role: "user",
                                content: `Verse translation: ${translation}\nReference: ${reference}`,
                            },
                        ],
                        max_tokens: 24,
                        temperature: 0.3,
                    }),
                },
            );
            const completion = await response.json();
            const content =
                completion.choices?.[0]?.message?.content?.trim() ||
                "Quranic Wisdom";
            console.log(`${LOG_PREFIX} Direct OpenAI response (${name})`, {
                source: "openai-direct-dev",
                contentLength: content.length,
                preview: content.slice(0, 120),
            });
            return { content };
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: data.model,
                    messages: data.messages,
                    max_tokens: data.max_tokens,
                    temperature: data.temperature,
                    presence_penalty: data.presence_penalty,
                    frequency_penalty: data.frequency_penalty,
                }),
            },
        );
        const completion = await response.json();
        const content =
            completion.choices?.[0]?.message?.content?.trim() || "";
        console.log(`${LOG_PREFIX} Direct OpenAI response (${name})`, {
            source: "openai-direct-dev",
            contentLength: content.length,
            preview: content.slice(0, 120),
        });
        return { content };
    }

    async getOnboardingData() {
        try {
            const stored = await AsyncStorage.getItem("onboarding_data");
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn("Error reading local onboarding data:", error);
        }

        try {
            this.initialize();
            const user = AuthService.getCurrentUser();
            if (!user) return null;

            const onboardingRef = ref(
                this.database,
                `users/${user.uid}/profile/onboarding`,
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
            const user = await AuthService.ensureAuthenticated();
            const userId = user.uid;
            const onboardingData = await this.getOnboardingData();
            const systemPrompt = getIslamicSystemPrompt({ onboardingData });
            const conversationHistory =
                await this.getConversationHistory(userId);

            const messages = [
                { role: "system", content: systemPrompt },
                ...conversationHistory,
                { role: "user", content: message },
            ];

            const deviceHash = await DeviceIdentityService.getDeviceHash();

            const { content: aiResponse, aiMessageCount } =
                await this.callCloudFunction("chatCompletion", {
                    messages,
                    deviceHash,
                    model: "gpt-4",
                    max_tokens: 800,
                    temperature: 0.7,
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1,
                });

            if (typeof aiMessageCount === "number") {
                await MessageUsageService.applyServerCount(
                    userId,
                    aiMessageCount,
                );
            }

            await this.saveMessageToHistory(userId, message, aiResponse);
            return aiResponse;
        } catch (error) {
            if (error?.code === "free-limit-reached") {
                throw error;
            }
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

    async getVerseCategory(translation, reference) {
        try {
            const { content: label } = await this.callCloudFunction(
                "verseCategory",
                { translation, reference },
            );
            return label || "Quranic Wisdom";
        } catch (error) {
            console.error("Verse category error:", error);
            return "Quranic Wisdom";
        }
    }
}

export const aiService = new AIService();
