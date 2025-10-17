// src/hooks/useVerseAI.js - AI integration for verse discussions
import { useState, useCallback } from 'react';
import { aiService } from '../services/aiService';

export const useVerseAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const askAboutVerse = useCallback(async (verse, question = null) => {
    try {
      setLoading(true);
      setError(null);

      // Create a detailed prompt for verse discussion
      const verseContext = `
Verse: ${verse.text}
Translation: ${verse.translation}
Surah: ${verse.surah?.englishName || ''} (${verse.surah?.number || ''})
Verse Number: ${verse.numberInSurah}
`;

      const prompt = question 
        ? `Please help me understand this verse from the Quran better: ${verseContext}

Specific question: ${question}

Please provide insights about the meaning, context, and practical application of this verse.`
        : `Please help me understand this verse from the Quran: ${verseContext}

Please provide:
1. The meaning and interpretation of this verse
2. Historical context if relevant
3. Practical application in daily life
4. Connection to other Quranic teachings
5. Key lessons we can learn from it`;

      const response = await aiService.sendMessage(prompt);
      return response;
    } catch (error) {
      console.error('Error getting AI response about verse:', error);
      setError('Failed to get AI response. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const explainConcept = useCallback(async (concept, verseContext = null) => {
    try {
      setLoading(true);
      setError(null);

      const prompt = verseContext 
        ? `Please explain the Islamic concept of "${concept}" in relation to this Quran verse:

${verseContext}

Provide a clear explanation with Islamic references and practical examples.`
        : `Please explain the Islamic concept of "${concept}" according to Quranic teachings and authentic Hadith. Provide practical guidance and examples.`;

      const response = await aiService.sendMessage(prompt);
      return response;
    } catch (error) {
      console.error('Error explaining concept:', error);
      setError('Failed to explain concept. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVerseReflection = useCallback(async (verse) => {
    try {
      setLoading(true);
      setError(null);

      const prompt = `Help me reflect deeply on this Quran verse:

Arabic: ${verse.text}
Translation: ${verse.translation}
Reference: ${verse.surah?.englishName} ${verse.numberInSurah}

Please provide:
1. Deep spiritual reflection on this verse
2. How it can guide my daily actions and decisions
3. Questions for personal contemplation
4. Ways to implement its teachings in modern life

Please keep the response thoughtful and practical for personal growth.`;

      const response = await aiService.sendMessage(prompt);
      return response;
    } catch (error) {
      console.error('Error getting verse reflection:', error);
      setError('Failed to generate reflection. Please try again.');
      throw error;
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