export function buildExplainVersePrompt(verse) {
    if (!verse) return "Explain this verse.";

    const reference =
        verse.reference ||
        (verse.surah?.englishName
            ? `${verse.surah.englishName} ${verse.numberInSurah ?? verse.ayah}`
            : verse.ayah
              ? `Surah ${verse.surah ?? ""}:${verse.ayah}`
              : "");

    const arabic = verse.text || verse.arabicText || "";
    const translation = verse.translation || "";

    return `Explain this verse:

Arabic: ${arabic}
Translation: ${translation}
Reference: ${reference}

Please share the meaning, context, and how to apply it in daily life.`;
}
