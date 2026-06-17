import { seededShuffle } from "./array";

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
