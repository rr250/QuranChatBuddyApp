/**
 * Cloud Functions for Quran Chat Buddy.
 *
 * Deploy with: firebase deploy --only functions
 * Set secret:  firebase functions:secrets:set OPENAI_API_KEY
 */

const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

setGlobalOptions({maxInstances: 10});

admin.initializeApp();

const openaiApiKey = defineSecret("OPENAI_API_KEY");

const ALLOWED_MODELS = new Set(["gpt-4", "gpt-4o-mini"]);

const callOpenAI = async (apiKey, payload) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OpenAI API error:", response.status, errorBody);
    throw new HttpsError("internal", "AI service unavailable");
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new HttpsError("internal", "Empty AI response");
  }

  return content;
};

exports.chatCompletion = onCall(
    {secrets: [openaiApiKey]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }

      const {
        messages,
        model = "gpt-4",
        max_tokens = 800,
        temperature = 0.7,
        presence_penalty = 0.1,
        frequency_penalty = 0.1,
      } = request.data ?? {};

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new HttpsError("invalid-argument", "messages array is required");
      }

      if (!ALLOWED_MODELS.has(model)) {
        throw new HttpsError("invalid-argument", "Unsupported model");
      }

      const content = await callOpenAI(openaiApiKey.value(), {
        model,
        messages,
        max_tokens,
        temperature,
        presence_penalty,
        frequency_penalty,
      });

      return {content};
    },
);

exports.verseCategory = onCall(
    {secrets: [openaiApiKey]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }

      const {translation, reference} = request.data ?? {};

      if (!translation || !reference) {
        throw new HttpsError(
            "invalid-argument",
            "translation and reference are required",
        );
      }

      const content = await callOpenAI(openaiApiKey.value(), {
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
      });

      return {content};
    },
);

exports.sendDailyQuizNotification = onSchedule(
    {
      schedule: "0 9 * * *",
      timeZone: "UTC",
    },
    async () => {
      const message = {
        notification: {
          title: "Daily Islamic Quiz",
          body: "Test your Islamic knowledge with today's quiz!",
        },
        topic: "daily_quiz",
      };

      return admin.messaging().send(message);
    },
);
