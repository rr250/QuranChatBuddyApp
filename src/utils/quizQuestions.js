import { seededShuffle } from "./array";

export const normalizeQuizPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.questions)) return payload.questions;
    return [];
};

/** Remove exact duplicate question_text entries; re-number ids sequentially. */
export const dedupeRawQuestions = (questionsArray) => {
    if (!Array.isArray(questionsArray)) return [];

    const seen = new Set();
    const unique = [];

    for (const question of questionsArray) {
        const key = (question?.question_text ?? "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        unique.push({ ...question, id: unique.length + 1 });
    }

    return unique;
};

export const shuffleQuestionOptions = (question, seed) => {
    const indexed = question.options.map((text, index) => ({ text, index }));
    const shuffled = seededShuffle(indexed, `${seed}-options`);

    return {
        ...question,
        options: shuffled.map((item) => item.text),
        correctAnswer: shuffled.findIndex(
            (item) => item.index === question.correctAnswer,
        ),
    };
};

export const transformQuestions = (questionsArray) => {
    if (!Array.isArray(questionsArray)) {
        console.error("Questions data is not an array:", questionsArray);
        return [];
    }

    return questionsArray
        .map((question, index) => {
            if (!question?.options || !Array.isArray(question.options)) {
                console.error(`Invalid question at index ${index}:`, question);
                return null;
            }

            const correctOptionIndex = question.options.findIndex(
                (option) => option?.id === question.correct_option_id,
            );

            if (correctOptionIndex === -1) {
                console.error(
                    `No matching correct option found for question ${question.id}:`,
                    question,
                );
            }

            return {
                id: question.id ?? index + 1,
                question: question.question_text ?? "Question text missing",
                options: question.options.map(
                    (option) => option?.text ?? "Option missing",
                ),
                correctAnswer: correctOptionIndex >= 0 ? correctOptionIndex : 0,
                explanation:
                    question.explanation ??
                    `The correct answer is ${
                        question.options[correctOptionIndex]?.text ?? "Unknown"
                    }`,
                difficulty: question.metadata?.difficulty ?? "medium",
                category:
                    question.metadata?.category?.toLowerCase() ?? "general",
            };
        })
        .filter(Boolean);
};

/**
 * Pick daily questions preferring IDs the user has not seen yet.
 * When fewer than `count` unseen remain, the bank resets and a new cycle starts.
 */
export const pickUnseenQuestions = (
    allQuestions,
    seenIds = [],
    count,
    seed,
) => {
    if (!allQuestions.length || count <= 0) {
        return { picked: [], nextSeenIds: [...seenIds] };
    }

    const seenSet = new Set(seenIds);
    let pool = allQuestions.filter((question) => !seenSet.has(question.id));
    let nextSeenIds = [...seenIds];

    if (pool.length < count) {
        pool = allQuestions;
        nextSeenIds = [];
    }

    const picked = seededShuffle(pool, seed).slice(0, count);
    const pickedIds = picked.map((question) => question.id);
    nextSeenIds = [...new Set([...nextSeenIds, ...pickedIds])];

    return { picked, nextSeenIds };
};

export const collectSeenIdsFromQuizResults = (quizResults = {}) => {
    const ids = [];
    for (const result of Object.values(quizResults)) {
        for (const answer of result?.answers ?? []) {
            if (answer?.questionId != null) {
                ids.push(answer.questionId);
            }
        }
    }
    return [...new Set(ids)];
};
