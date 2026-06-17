import { getLocalChapter, getLocalSurahIndex } from "../data/quranLocal";

const hashString = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
};

export const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const buildVerse = (surahNumber, ayahNumber) => {
    const chapter = getLocalChapter(surahNumber);
    const verse = chapter?.verses.find((item) => item.id === ayahNumber);
    if (!verse || !chapter) return null;

    return {
        surah: surahNumber,
        ayah: ayahNumber,
        arabicText: verse.text,
        translation: verse.translation,
        reference: `Quran ${surahNumber}:${ayahNumber} (${chapter.transliteration})`,
    };
};

/** Deterministic pseudo-random verse for a calendar day (+ optional salt for carousel slides) */
export const getDailyVerse = (salt = 0, date = new Date()) => {
    const dateKey = getDateKey(date);
    const surahIndex = getLocalSurahIndex();
    if (!surahIndex.length) return null;

    const seed = hashString(`${dateKey}:${salt}`);
    const surahMeta = surahIndex[seed % surahIndex.length];
    const ayahNumber =
        (Math.floor(seed / surahIndex.length) % surahMeta.total_verses) + 1;

    return buildVerse(surahMeta.id, ayahNumber);
};

export const getDailyVerseBatch = (count = 5, date = new Date()) =>
    Array.from({ length: count }, (_, index) => getDailyVerse(index, date)).filter(
        Boolean,
    );
