import React, { useMemo } from "react";
import { View, StyleSheet, Share } from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { GlassSurface } from "../ui/Glass";
import { getLocalChapter } from "../../data/quranLocal";

const DAILY_VERSES = [
    { surah: 2, ayah: 255 },
    { surah: 112, ayah: 1 },
    { surah: 1, ayah: 2 },
    { surah: 24, ayah: 35 },
    { surah: 55, ayah: 13 },
    { surah: 94, ayah: 5 },
];

const buildVerse = (surahNumber, ayahNumber) => {
    const chapter = getLocalChapter(surahNumber);
    const verse = chapter?.verses.find((item) => item.id === ayahNumber);
    if (!verse) return null;

    return {
        arabicText: verse.text,
        translation: verse.translation,
        reference: `Quran ${surahNumber}:${ayahNumber} (${chapter.transliteration})`,
    };
};

export const QuranVerseCard = () => {
    const verse = useMemo(() => {
        const dayIndex = new Date().getDate() % DAILY_VERSES.length;
        const pick = DAILY_VERSES[dayIndex];
        return buildVerse(pick.surah, pick.ayah);
    }, []);

    const loadNewVerse = () => {
        const pick = DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];
        return buildVerse(pick.surah, pick.ayah);
    };

    const [currentVerse, setCurrentVerse] = React.useState(verse);

    const handleShare = async () => {
        if (!currentVerse) return;

        try {
            await Share.share({
                message: `${currentVerse.arabicText}\n\n"${currentVerse.translation}"\n\n— ${currentVerse.reference}`,
                title: "Verse from Quran",
            });
        } catch (error) {
            console.error("Error sharing verse:", error);
        }
    };

    if (!currentVerse) return null;

    return (
        <GlassSurface style={styles.card}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MaterialCommunityIcons
                            name="book-open-page-variant"
                            size={22}
                            color="#fff"
                        />
                        <Text style={styles.title}>Verse of the Day</Text>
                    </View>
                    <IconButton
                        icon="refresh"
                        iconColor="#fff"
                        size={20}
                        onPress={() => setCurrentVerse(loadNewVerse())}
                    />
                </View>

                <Text style={styles.arabicText}>{currentVerse.arabicText}</Text>
                <Text style={styles.translation}>&quot;{currentVerse.translation}&quot;</Text>
                <Text style={styles.reference}>— {currentVerse.reference}</Text>

                <View style={styles.actions}>
                    <Button mode="outlined" onPress={handleShare} textColor="#fff" icon="share">
                        Share
                    </Button>
                </View>
            </View>
        </GlassSurface>
    );
};

const styles = StyleSheet.create({
    card: { marginBottom: theme.spacing.md },
    content: { padding: theme.spacing.lg },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 17, fontWeight: "700", color: "#fff" },
    arabicText: {
        fontSize: 20,
        lineHeight: 32,
        textAlign: "center",
        color: "#fff",
        marginBottom: theme.spacing.md,
    },
    translation: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        color: "rgba(255,255,255,0.85)",
        fontStyle: "italic",
        marginBottom: theme.spacing.sm,
    },
    reference: {
        textAlign: "center",
        color: "rgba(255,255,255,0.65)",
        marginBottom: theme.spacing.md,
    },
    actions: { alignItems: "center" },
});
