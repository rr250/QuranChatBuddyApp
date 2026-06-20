import { useState, useCallback } from "react";
import { aiService } from "../services/aiService";
import logger from "../services/logger";

export const useVerseAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const askAboutVerse = useCallback(async (verse, question = null) => {
        try {
            setLoading(true);
            setError(null);

            const verseContext = `Verse: ${verse.text}\nTranslation: ${verse.translation}\nSurah: ${verse.surah?.englishName ?? ""} (${verse.surah?.number ?? ""})\nVerse Number: ${verse.numberInSurah}`;

            const prompt = question
                ? `Please help me understand this verse from the Quran better: ${verseContext}\n\nSpecific question: ${question}\n\nPlease provide insights about the meaning, context, and practical application of this verse.`
                : `Please help me understand this verse from the Quran: ${verseContext}\n\nPlease provide:\n1. The meaning and interpretation of this verse\n2. Historical context if relevant\n3. Practical application in daily life\n4. Connection to other Quranic teachings\n5. Key lessons we can learn from it`;

            return await aiService.sendMessage(prompt);
        } catch (err) {
            logger.error("Error getting AI response about verse:", err);
            setError("Failed to get AI response. Please try again.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const explainConcept = useCallback(async (concept, verseContext = null) => {
        try {
            setLoading(true);
            setError(null);

            const prompt = verseContext
                ? `Please explain the Islamic concept of "${concept}" in relation to this Quran verse:\n\n${verseContext}\n\nProvide a clear explanation with Islamic references and practical examples.`
                : `Please explain the Islamic concept of "${concept}" according to Quranic teachings and authentic Hadith. Provide practical guidance and examples.`;

            return await aiService.sendMessage(prompt);
        } catch (err) {
            logger.error("Error explaining concept:", err);
            setError("Failed to explain concept. Please try again.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getVerseReflection = useCallback(async (verse) => {
        try {
            setLoading(true);
            setError(null);

            const prompt = `Help me reflect deeply on this Quran verse:\n\nArabic: ${verse.text}\nTranslation: ${verse.translation}\nReference: ${verse.surah?.englishName ?? ""} ${verse.numberInSurah}\n\nPlease provide:\n1. Deep spiritual reflection on this verse\n2. How it can guide my daily actions and decisions\n3. Questions for personal contemplation\n4. Ways to implement its teachings in modern life`;

            return await aiService.sendMessage(prompt);
        } catch (err) {
            logger.error("Error getting verse reflection:", err);
            setError("Failed to generate reflection. Please try again.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        askAboutVerse,
        explainConcept,
        getVerseReflection,
    };
};
