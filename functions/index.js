/**
 * Cloud Functions for Quran Chat Buddy (codebase: qcb-app).
 *
 * SAFE deploy (updates only named functions):
 *   npm run deploy --prefix functions
 *
 * Includes: chatCompletion, verseCategory, sendDailyQuizNotification,
 * resolveDeviceAuth, registerDeviceAccount, getMessageUsage,
 * checkDeviceRegistration
 *
 * Device restore: createCustomToken needs Service Account Token Creator on the
 * functions runtime SA. Gen 2 defaults to compute@developer; we use
 * firebase-adminsdk instead (see SERVICE_ACCOUNT).
 *
 * Avoid: firebase deploy --only functions
 *        firebase deploy
 * (those can remove Cloud Functions not defined in this repo)
 *
 * Set secret: firebase functions:secrets:set OPENAI_API_KEY
 *
 * RTDB instance (must match EXPO_PUBLIC_FIREBASE_DATABASE_URL in the app).
 */

const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {
  defineSecret,
  defineInt,
} = require("firebase-functions/params");
const admin = require("firebase-admin");

const SERVICE_ACCOUNT = [
  "firebase-adminsdk-fbsvc@",
  "quran-chat-buddy-prayer-time.iam.gserviceaccount.com",
].join("");

setGlobalOptions({
  maxInstances: 10,
  serviceAccount: SERVICE_ACCOUNT,
});

const DEFAULT_DATABASE_URL =
  "https://quran-chat-buddy-prayer-time-ebbc4.firebaseio.com";

const openaiApiKey = defineSecret("OPENAI_API_KEY");
const freeMessageLimit = defineInt("FREE_MESSAGE_LIMIT", {default: 10});

admin.initializeApp({
  databaseURL: DEFAULT_DATABASE_URL,
});

const getDatabase = () => admin.database();

const DEVICE_HASH_MIN_LENGTH = 32;
const DEVICE_HASH_MAX_LENGTH = 128;

const isValidDeviceHash = (deviceHash) =>
  typeof deviceHash === "string" &&
  deviceHash.length >= DEVICE_HASH_MIN_LENGTH &&
  deviceHash.length <= DEVICE_HASH_MAX_LENGTH;

const ALLOWED_MODELS = new Set(["gpt-4", "gpt-4o-mini"]);

const now = () => Date.now();

const asHttpsError = (error, fallbackMessage) => {
  if (error instanceof HttpsError) {
    return error;
  }
  console.error(fallbackMessage, error);
  const message =
    typeof error?.message === "string" && error.message ?
      error.message :
      fallbackMessage;
  return new HttpsError("internal", message);
};

const getMergedUsageCount = async (uid, deviceHash) => {
  const db = getDatabase();
  const userSnap = await db.ref(`users/${uid}/usage/aiMessageCount`).get();
  const userCount = userSnap.exists() ? Number(userSnap.val()) || 0 : 0;

  if (!deviceHash) {
    return userCount;
  }

  const deviceSnap = await db
      .ref(`device_usage/${deviceHash}/aiMessageCount`)
      .get();
  const deviceCount = deviceSnap.exists() ?
    Number(deviceSnap.val()) || 0 :
    0;

  return Math.max(userCount, deviceCount);
};

const assertDeviceLinkedToUser = async (uid, deviceHash) => {
  if (!isValidDeviceHash(deviceHash)) {
    throw new HttpsError("invalid-argument", "deviceHash is required");
  }

  const db = getDatabase();
  const accountRef = db.ref(`device_accounts/${deviceHash}`);
  const accountSnap = await accountRef.get();

  if (!accountSnap.exists()) {
    await accountRef.set({
      uid,
      linkedAt: now(),
    });
    await db.ref(`device_usage/${deviceHash}`).set({
      linkedUid: uid,
      aiMessageCount: 0,
      updatedAt: now(),
    });
    return;
  }

  if (accountSnap.val()?.uid !== uid) {
    throw new HttpsError(
        "permission-denied",
        "Device is not linked to this account",
    );
  }
};

const isUserPremium = async (uid) => {
  const snap = await getDatabase()
      .ref(`users/${uid}/subscription/isPremium`)
      .get();
  return snap.val() === true;
};

const incrementUsageCount = async (uid, deviceHash) => {
  const db = getDatabase();
  const nextCount = (await getMergedUsageCount(uid, deviceHash)) + 1;

  await db.ref(`users/${uid}/usage/aiMessageCount`).set(nextCount);

  if (deviceHash) {
    await db.ref(`device_usage/${deviceHash}`).update({
      linkedUid: uid,
      aiMessageCount: nextCount,
      updatedAt: now(),
    });
  }

  return nextCount;
};

const enforceChatQuota = async (uid, deviceHash) => {
  if (await isUserPremium(uid)) {
    return;
  }

  await assertDeviceLinkedToUser(uid, deviceHash);

  const currentCount = await getMergedUsageCount(uid, deviceHash);
  const limit = freeMessageLimit.value();

  if (currentCount >= limit) {
    throw new HttpsError(
        "resource-exhausted",
        "Free message limit reached",
        {code: "free-limit-reached", limit, count: currentCount},
    );
  }
};

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
      try {
        if (!request.auth) {
          throw new HttpsError("unauthenticated", "Authentication required");
        }

        const uid = request.auth.uid;
        const {
          messages,
          deviceHash,
          model = "gpt-4",
          max_tokens: maxTokens = 800,
          temperature = 0.7,
          presence_penalty: presencePenalty = 0.1,
          frequency_penalty: frequencyPenalty = 0.1,
        } = request.data ?? {};

        if (!Array.isArray(messages) || messages.length === 0) {
          throw new HttpsError(
              "invalid-argument",
              "messages array is required",
          );
        }

        if (!ALLOWED_MODELS.has(model)) {
          throw new HttpsError("invalid-argument", "Unsupported model");
        }

        const apiKey = openaiApiKey.value();
        if (!apiKey) {
          throw new HttpsError(
              "failed-precondition",
              "OpenAI API key not configured",
          );
        }

        await enforceChatQuota(uid, deviceHash);

        const content = await callOpenAI(apiKey, {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          presence_penalty: presencePenalty,
          frequency_penalty: frequencyPenalty,
        });

        const aiMessageCount = await incrementUsageCount(uid, deviceHash);

        return {content, aiMessageCount};
      } catch (error) {
        throw asHttpsError(error, "chatCompletion failed");
      }
    },
);

exports.verseCategory = onCall(
    {secrets: [openaiApiKey]},
    async (request) => {
      try {
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

        const apiKey = openaiApiKey.value();
        if (!apiKey) {
          throw new HttpsError(
              "failed-precondition",
              "OpenAI API key not configured",
          );
        }

        const content = await callOpenAI(apiKey, {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: [
                "Categorize Quran verses with a short Islamic theme label ",
                "(2-4 words). Examples: Trust in Allah, Patience, Gratitude, ",
                "Mercy. Reply with only the label, no quotes or punctuation.",
              ].join(""),
            },
            {
              role: "user",
              content: [
                `Verse translation: ${translation}`,
                `\nReference: ${reference}`,
              ].join(""),
            },
          ],
          max_tokens: 24,
          temperature: 0.3,
        });

        return {content};
      } catch (error) {
        throw asHttpsError(error, "verseCategory failed");
      }
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

/**
 * Returns a custom token for an existing device-linked anonymous user.
 * Callable without auth (reinstall / clear-data flow).
 */
exports.checkDeviceRegistration = onCall(async (request) => {
  try {
    const {deviceHash} = request.data ?? {};
    if (!isValidDeviceHash(deviceHash)) {
      throw new HttpsError("invalid-argument", "deviceHash is required");
    }

    const snap = await getDatabase()
        .ref(`device_accounts/${deviceHash}`)
        .get();

    return {
      registered: snap.exists(),
      linkedUid: snap.exists() ? snap.val()?.uid ?? null : null,
    };
  } catch (error) {
    throw asHttpsError(error, "checkDeviceRegistration failed");
  }
});

exports.resolveDeviceAuth = onCall(async (request) => {
  try {
    const {deviceHash} = request.data ?? {};
    if (!isValidDeviceHash(deviceHash)) {
      throw new HttpsError("invalid-argument", "deviceHash is required");
    }

    const db = getDatabase();
    const accountRef = db.ref(`device_accounts/${deviceHash}`);
    const accountSnap = await accountRef.get();

    if (!accountSnap.exists()) {
      return {needsAnonymousSignIn: true};
    }

    const uid = accountSnap.val()?.uid;
    if (!uid) {
      await accountRef.remove();
      return {needsAnonymousSignIn: true};
    }

    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      await accountRef.remove();
      await db.ref(`device_usage/${deviceHash}`).remove();
      return {needsAnonymousSignIn: true};
    }

    try {
      const customToken = await admin.auth().createCustomToken(uid);
      return {customToken, uid, linkedUid: uid, restored: true};
    } catch (error) {
      console.error("createCustomToken failed:", error);
      return {
        needsAnonymousSignIn: false,
        linkedUid: uid,
        restoreUnavailable: true,
      };
    }
  } catch (error) {
    throw asHttpsError(error, "resolveDeviceAuth failed");
  }
});

/** Links the authenticated user to this device (first install only). */
exports.registerDeviceAccount = onCall(async (request) => {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {deviceHash} = request.data ?? {};
    if (!isValidDeviceHash(deviceHash)) {
      throw new HttpsError("invalid-argument", "deviceHash is required");
    }

    const uid = request.auth.uid;
    const db = getDatabase();
    const accountRef = db.ref(`device_accounts/${deviceHash}`);
    const usageRef = db.ref(`device_usage/${deviceHash}`);

    const existingSnap = await accountRef.get();
    if (existingSnap.exists() && existingSnap.val()?.uid !== uid) {
      throw new HttpsError(
          "already-exists",
          "Device already linked to another account",
      );
    }

    await accountRef.set({
      uid,
      linkedAt: now(),
    });

    const userUsageSnap = await db
        .ref(`users/${uid}/usage/aiMessageCount`)
        .get();
    const userCount = userUsageSnap.exists() ?
      Number(userUsageSnap.val()) || 0 :
      0;

    const deviceUsageSnap = await usageRef.get();
    const deviceCount = deviceUsageSnap.exists() ?
      Number(deviceUsageSnap.val()?.aiMessageCount) || 0 :
      0;
    const mergedCount = Math.max(userCount, deviceCount);

    await usageRef.set({
      linkedUid: uid,
      aiMessageCount: mergedCount,
      updatedAt: now(),
    });

    if (mergedCount > userCount) {
      await db.ref(`users/${uid}/usage/aiMessageCount`).set(mergedCount);
    }

    return {ok: true, aiMessageCount: mergedCount};
  } catch (error) {
    throw asHttpsError(error, "registerDeviceAccount failed");
  }
});

/** Per-device message usage (survives reinstall / wrong session). */
exports.getMessageUsage = onCall(async (request) => {
  try {
    const {deviceHash} = request.data ?? {};
    if (!isValidDeviceHash(deviceHash)) {
      throw new HttpsError("invalid-argument", "deviceHash is required");
    }

    const db = getDatabase();
    const accountSnap = await db.ref(`device_accounts/${deviceHash}`).get();
    const linkedUid = accountSnap.exists() ?
      accountSnap.val()?.uid :
      null;
    const authUid = request.auth?.uid ?? null;
    const effectiveUid = linkedUid || authUid;

    if (!effectiveUid) {
      return {
        count: 0,
        limit: freeMessageLimit.value(),
        linkedUid: null,
        sessionMismatch: false,
      };
    }

    const count = await getMergedUsageCount(effectiveUid, deviceHash);
    const limit = freeMessageLimit.value();

    return {
      count,
      limit,
      linkedUid: effectiveUid,
      sessionMismatch: Boolean(
          linkedUid && authUid && linkedUid !== authUid,
      ),
    };
  } catch (error) {
    throw asHttpsError(error, "getMessageUsage failed");
  }
});
