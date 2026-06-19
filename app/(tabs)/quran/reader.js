// src/screens/SurahReaderScreen.js - Individual Surah reading with AI integration
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { ScreenShell, screenContentPadding } from "../../../src/components/navigation/ScreenShell";
import { useSurah } from "../../../src/hooks/useQuran";
import { theme } from "../../../src/constants/theme";
import { glass } from "../../../src/constants/glass";
import { useLocalSearchParams } from "expo-router";
import { openChatWithPrompt } from "../../../src/utils/openChatWithPrompt";
import { buildExplainVersePrompt } from "../../../src/utils/verseChatPrompts";

export default function SurahReaderScreen() {
    const { surahNumber, surahName, startVerse } = useLocalSearchParams();
    const scrollRef = useRef(null);
    const hasScrolledRef = useRef(false);
    const {
        surah,
        loading,
        error,
        readVerses,
        favoriteVerses,
        markVerseAsRead,
        toggleFavoriteVerse,
        markSurahAsCompleted,
        completionPercentage,
    } = useSurah(parseInt(surahNumber));

    // Reading settings
    const [fontSize, setFontSize] = useState(18);
    const [showTranslation, setShowTranslation] = useState(true);

    useEffect(() => {
        hasScrolledRef.current = false;
    }, [surahNumber, startVerse]);

    useEffect(() => {
        if (!surah?.verses?.length || hasScrolledRef.current) return;

        const targetVerse = parseInt(startVerse, 10);
        if (!targetVerse || targetVerse <= 1) return;

        const timer = setTimeout(() => {
            scrollRef.current?.scrollTo({
                y: Math.max(0, (targetVerse - 1) * 132),
                animated: true,
            });
            hasScrolledRef.current = true;
        }, 250);

        return () => clearTimeout(timer);
    }, [surah, startVerse]);

    const handleVersePress = (verse) => {
        // Mark verse as read when tapped
        if (!readVerses.has(verse.numberInSurah)) {
            markVerseAsRead(verse.numberInSurah);
        }
    };

    const handleAskAI = (verse) => {
        openChatWithPrompt(
            buildExplainVersePrompt({
                ...verse,
                surah: { englishName: surah?.englishName },
            }),
        );
    };

    const handleVerseLongPress = (verse) => {
        Alert.alert(
            "Verse Options",
            `Surah ${surah.englishName}, Verse ${verse.numberInSurah}`,
            [
                {
                    text: "Ask QCB about this verse",
                    onPress: () => handleAskAI(verse),
                },
                {
                    text: favoriteVerses.has(verse.numberInSurah)
                        ? "Remove from favorites"
                        : "Add to favorites",
                    onPress: () => toggleFavoriteVerse(verse.numberInSurah),
                },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const handleCompleteSurah = () => {
        Alert.alert(
            "Complete Surah",
            `Mark Surah ${surah.englishName} as completed?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete",
                    onPress: () => {
                        markSurahAsCompleted();
                        Alert.alert(
                            "Congratulations!",
                            `You have completed Surah ${surah.englishName}! 🎉`
                        );
                    },
                },
            ]
        );
    };

    const renderVerseItem = (verse, index) => {
        const isRead = readVerses.has(verse.numberInSurah);
        const isFavorited = favoriteVerses.has(verse.numberInSurah);

        return (
            <TouchableOpacity
                key={verse.numberInSurah}
                style={[
                    styles.verseContainer,
                    isRead && styles.readVerse,
                    isFavorited && styles.favoritedVerse,
                ]}
                onPress={() => handleVersePress(verse)}
                onLongPress={() => handleVerseLongPress(verse)}
                activeOpacity={0.7}
            >
                <View style={styles.verseHeader}>
                    <View style={styles.verseNumber}>
                        <Text style={styles.verseNumberText}>
                            {verse.numberInSurah}
                        </Text>
                    </View>
                    <View style={styles.verseActions}>
                        {isFavorited && (
                            <Text style={styles.favoriteIcon}>⭐</Text>
                        )}
                        {isRead && <Text style={styles.readIcon}>✓</Text>}
                    </View>
                </View>

                <View style={styles.verseContent}>
                    <Text
                        style={[styles.arabicText, { fontSize: fontSize + 4 }]}
                    >
                        {verse.text}
                    </Text>

                    {showTranslation && verse.translation && (
                        <Text
                            style={[
                                styles.translationText,
                                { fontSize: fontSize - 2 },
                            ]}
                        >
                            {verse.translation}
                        </Text>
                    )}
                </View>

                <View style={styles.verseFooter}>
                    <Text style={styles.verseInfo}>
                        Juz {verse.juz} • Page {verse.page}
                    </Text>
                    <TouchableOpacity
                        style={styles.aiButton}
                        onPress={() => handleAskAI(verse)}
                    >
                        <Text style={styles.aiButtonText}>🤖 Ask QCB</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderControls = () => (
        <View style={styles.controlsContainer}>
            <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowTranslation(!showTranslation)}
            >
                <Text style={styles.controlButtonText}>
                    {showTranslation ? "Hide" : "Show"} Translation
                </Text>
            </TouchableOpacity>

            <View style={styles.fontSizeControls}>
                <TouchableOpacity
                    style={styles.fontButton}
                    onPress={() => setFontSize(Math.max(14, fontSize - 2))}
                >
                    <Text style={styles.fontButtonText}>A-</Text>
                </TouchableOpacity>
                <Text style={styles.fontSizeText}>{fontSize}</Text>
                <TouchableOpacity
                    style={styles.fontButton}
                    onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                >
                    <Text style={styles.fontButtonText}>A+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProgressBar = () => (
        <View style={styles.progressSection}>
            <Text style={styles.progressText}>
                {completionPercentage}% · {readVerses.size}/{surah?.numberOfAyahs || 0} verses read
            </Text>
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${completionPercentage}%` },
                    ]}
                />
            </View>
        </View>
    );

    const completeAction = (
        <TouchableOpacity
            onPress={handleCompleteSurah}
            style={styles.completeButton}
        >
            <Text style={styles.completeButtonText}>✓</Text>
        </TouchableOpacity>
    );

    const readerSubtitle =
        surah
            ? `${surah.name} · ${surah.numberOfAyahs} verses · ${surah.revelationType}`
            : "Loading...";

    if (loading) {
        return (
            <ScreenShell title={surahName || "Surah"} subtitle="Loading verses...">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading Surah...</Text>
                </View>
            </ScreenShell>
        );
    }

    if (error) {
        return (
            <ScreenShell title={surahName || "Surah"} subtitle="Something went wrong">
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </ScreenShell>
        );
    }

    return (
        <ScreenShell
            title={surah?.englishName || surahName}
            subtitle={readerSubtitle}
            rightAction={completeAction}
        >
            {renderProgressBar()}
            {renderControls()}

            <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, screenContentPadding]}
                showsVerticalScrollIndicator={false}
            >
                {surah?.verses?.map((verse, index) =>
                    renderVerseItem(verse, index)
                )}
            </ScrollView>
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    completeButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
        alignItems: "center",
        justifyContent: "center",
    },
    completeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    progressSection: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    progressText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        marginBottom: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: theme.colors.secondary,
        borderRadius: 2,
    },
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    controlButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: glass.backgroundStrong,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    controlButtonText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
    },
    fontSizeControls: {
        flexDirection: "row",
        alignItems: "center",
    },
    fontButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: glass.backgroundStrong,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    fontButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#fff",
    },
    fontSizeText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: theme.spacing.md,
    },
    basmalaContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    basmalaText: {
        fontSize: 20,
        color: theme.colors.secondary,
        fontWeight: "bold",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
    },
    verseContainer: {
        backgroundColor: glass.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    readVerse: {
        borderColor: theme.colors.primary,
        backgroundColor: glass.tint,
    },
    favoritedVerse: {
        borderColor: theme.colors.secondary,
    },
    verseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    verseNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    verseNumberText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
    },
    verseActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    favoriteIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    readIcon: {
        fontSize: 16,
        color: theme.colors.primary,
    },
    verseContent: {
        marginBottom: 12,
    },
    arabicText: {
        fontSize: 18,
        lineHeight: 32,
        color: "#fff",
        textAlign: "right",
        marginBottom: 12,
    },
    translationText: {
        fontSize: 16,
        lineHeight: 24,
        color: "rgba(255,255,255,0.8)",
        fontStyle: "italic",
    },
    verseFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    verseInfo: {
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
    },
    aiButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
    },
    aiButtonText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    modalCloseText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    versePreview: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    modalArabicText: {
        fontSize: 18,
        lineHeight: 32,
        color: "#333",
        textAlign: "right",
        marginBottom: 12,
    },
    modalTranslationText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#666",
        fontStyle: "italic",
    },
    customQuestionContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    customQuestionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    customQuestionInput: {
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: "top",
    },
    askButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 20,
    },
    askButtonDisabled: {
        opacity: 0.5,
    },
    askButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    aiResponseContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
    },
    aiResponseTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 12,
    },
    aiResponseText: {
        fontSize: 15,
        lineHeight: 24,
        color: "#333",
    },
});
