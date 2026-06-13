import {
    getLocalChapter,
    getLocalSurahIndex,
    mapChapterToSurah,
    mapIndexToSurahMeta,
} from "../data/quranLocal";

const searchInChapter = (chapter, query, language) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return chapter.verses
        .filter((verse) => {
            const arabic = verse.text?.toLowerCase() ?? "";
            const english = verse.translation?.toLowerCase() ?? "";
            if (language === "ar") return arabic.includes(normalized);
            return english.includes(normalized) || arabic.includes(normalized);
        })
        .map((verse) => ({
            number: verse.id,
            numberInSurah: verse.id,
            text: language === "ar" ? verse.text : (verse.translation ?? verse.text),
            surah: {
                number: chapter.id,
                name: chapter.name,
                englishName: chapter.transliteration,
            },
        }));
};

export const QuranApi = {
    async getAllSurahs() {
        return getLocalSurahIndex().map(mapIndexToSurahMeta);
    },

    async getSurah(surahNumber) {
        const chapter = getLocalChapter(surahNumber);
        if (!chapter) throw new Error(`Surah ${surahNumber} not found`);
        return mapChapterToSurah(chapter);
    },

    async getVerse(surahNumber, verseNumber) {
        const chapter = getLocalChapter(surahNumber);
        if (!chapter) throw new Error(`Surah ${surahNumber} not found`);

        const verse = chapter.verses.find((item) => item.id === verseNumber);
        if (!verse) throw new Error(`Verse ${verseNumber} not found`);

        return {
            number: verse.id,
            numberInSurah: verse.id,
            surah: {
                number: chapter.id,
                name: chapter.name,
                englishName: chapter.transliteration,
            },
            text: verse.text,
            translations: {
                asad: verse.translation ?? "",
                pickthall: verse.translation ?? "",
            },
            juz: null,
            page: null,
        };
    },

    async searchVerses(searchQuery, language = "en") {
        const matches = [];

        for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
            const chapter = getLocalChapter(surahNumber);
            if (!chapter) continue;
            matches.push(...searchInChapter(chapter, searchQuery, language));
        }

        return { count: matches.length, matches };
    },
};
