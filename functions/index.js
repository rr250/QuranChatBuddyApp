/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
// const {onDocumentCreated} = require("firebase-functions/v2/firestore");
// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const admin = require("firebase-admin");
admin.initializeApp();

// Send daily quiz notification
exports.sendDailyQuizNotification = onSchedule(
    {
      schedule: "0 9 * * *", // Daily at 9 AM
      timeZone: "UTC",
    },
    async (event) => {
      const message = {
        notification: {
          title: "🧠 Daily Islamic Quiz",
          body: "Test your Islamic knowledge with today's quiz!",
        },
        topic: "daily_quiz",
      };

      return admin.messaging().send(message);
    },
);

// Update user statistics
// exports.updateUserStats = onDocumentCreated(
//     "quiz_results/{userId}/quizzes/{quizId}",
//     async (event) => {
//       const result = event.data.data();
//       const userId = event.params.userId;

//       const userStatsRef = admin
//           .firestore()
//           .doc(`users/${userId}/stats/quiz`);

//       return userStatsRef.set(
//           {
//             totalQuizzes: admin.firestore.FieldValue.increment(1),
//             totalScore: admin.firestore.FieldValue.increment(result.score),
//             lastQuizDate: result.completedAt,
//           },
//           {merge: true},
//       );
//     },
// );
