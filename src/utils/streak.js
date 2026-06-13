import { getTodayDateString, getYesterdayDateString } from "./date";

export const EMPTY_STREAK = { current: 0, longest: 0, lastDate: null };

export const updateCompletionStreak = (
    currentStreak,
    passed,
    today = getTodayDateString(),
) => {
    const yesterday = getYesterdayDateString();
    const streak = { ...currentStreak };

    if (passed) {
        if (streak.lastDate === yesterday || streak.current === 0) {
            streak.current += 1;
            streak.longest = Math.max(streak.current, streak.longest);
        } else if (streak.lastDate !== today) {
            streak.current = 1;
        }
        streak.lastDate = today;
    } else if (streak.lastDate !== yesterday) {
        streak.current = 0;
    }

    return streak;
};

export const calculateConsecutiveDayStreak = (sessionDates) => {
    if (!sessionDates?.length) {
        return { current: 0, longest: 0, lastReadDate: null };
    }

    const dates = [...sessionDates].sort();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = dates.length - 1; i >= 0; i -= 1) {
        const currentDate = dates[i];
        const previousDate = i > 0 ? dates[i - 1] : null;

        if (i === dates.length - 1) {
            tempStreak = 1;
            if (currentDate === today || currentDate === yesterday) {
                currentStreak = 1;
            }
        } else {
            const diffDays = Math.ceil(
                Math.abs(new Date(previousDate) - new Date(currentDate)) /
                    86_400_000,
            );

            if (diffDays === 1) {
                tempStreak += 1;
                if (currentStreak > 0) currentStreak += 1;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
                currentStreak = 0;
            }
        }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
        current: currentStreak,
        longest: longestStreak,
        lastReadDate: dates.at(-1),
    };
};
