// src/screens/SurahReaderScreen.js - Individual Surah reading with AI integration
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useSurah } from "../../../src/hooks/useQuran";
import { useVerseAI } from "../../../src/hooks/useVerseAI";
import { colors, spacing } from "../../../src/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SurahReaderScreen() {
    const router = useRouter();
    const { surahNumber, surahName } = useLocalSearchParams();
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

    const {
        askAboutVerse,
        getVerseReflection,
        loading: aiLoading,
    } = useVerseAI();

    // AI Modal states
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [aiResponse, setAIResponse] = useState("");
    const [customQuestion, setCustomQuestion] = useState("");
    const [aiModalType, setAIModalType] = useState("explain"); // 'explain', 'reflect', 'custom'

    // Reading settings
    const [fontSize, setFontSize] = useState(18);
    const [showTranslation, setShowTranslation] = useState(true);

    const handleVersePress = (verse) => {
        // Mark verse as read when tapped
        if (!readVerses.has(verse.numberInSurah)) {
            markVerseAsRead(verse.numberInSurah);
        }
    };

    const handleVerseLongPress = (verse) => {
        Alert.alert(
            "Verse Options",
            `Surah ${surah.englishName}, Verse ${verse.numberInSurah}`,
            [
                {
                    text: "Ask AI about this verse",
                    onPress: () => openAIModal(verse, "explain"),
                },
                {
                    text: "Get reflection",
                    onPress: () => openAIModal(verse, "reflect"),
                },
                {
                    text: "Ask custom question",
                    onPress: () => openAIModal(verse, "custom"),
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

    const openAIModal = (verse, type) => {
        setSelectedVerse(verse);
        setAIModalType(type);
        setAIResponse("");
        setCustomQuestion("");
        setShowAIModal(true);
    };

    const handleAIRequest = async () => {
        if (!selectedVerse) return;

        try {
            let response;
            if (aiModalType === "explain") {
                response = await askAboutVerse(selectedVerse);
            } else if (aiModalType === "reflect") {
                response = await getVerseReflection(selectedVerse);
            } else if (aiModalType === "custom" && customQuestion.trim()) {
                response = await askAboutVerse(
                    selectedVerse,
                    customQuestion.trim()
                );
            }

            setAIResponse(response);
        } catch (error) {
            Alert.alert(
                "Error",
                "Failed to get AI response. Please try again."
            );
        }
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
                        onPress={() => openAIModal(verse, "explain")}
                    >
                        <Text style={styles.aiButtonText}>🤖 Ask AI</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <LinearGradient
            colors={[
                colors?.primary || "#2E8B57",
                colors?.primaryDark || "#1F5F3F",
            ]}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{surah?.englishName}</Text>
                    <Text style={styles.headerSubtitle}>
                        {surah?.name} • {surah?.numberOfAyahs} verses •{" "}
                        {surah?.revelationType}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={handleCompleteSurah}
                    style={styles.completeButton}
                >
                    <Text style={styles.completeButtonText}>✓</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.progressText}>
                    Progress: {completionPercentage}% • {readVerses.size}/
                    {surah?.numberOfAyahs || 0} verses read
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
        </LinearGradient>
    );

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

    const renderAIModal = () => (
        <Modal
            visible={showAIModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAIModal(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={() => setShowAIModal(false)}
                        style={styles.modalCloseButton}
                    >
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        AI Assistant - Verse {selectedVerse?.numberInSurah}
                    </Text>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.versePreview}>
                        <Text style={styles.modalArabicText}>
                            {selectedVerse?.text}
                        </Text>
                        {selectedVerse?.translation && (
                            <Text style={styles.modalTranslationText}>
                                {selectedVerse?.translation}
                            </Text>
                        )}
                    </View>

                    {aiModalType === "custom" && (
                        <View style={styles.customQuestionContainer}>
                            <Text style={styles.customQuestionLabel}>
                                Ask your question:
                            </Text>
                            <TextInput
                                style={styles.customQuestionInput}
                                placeholder="What would you like to know about this verse?"
                                value={customQuestion}
                                onChangeText={setCustomQuestion}
                                multiline
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.askButton,
                            aiLoading && styles.askButtonDisabled,
                        ]}
                        onPress={handleAIRequest}
                        disabled={
                            aiLoading ||
                            (aiModalType === "custom" && !customQuestion.trim())
                        }
                    >
                        {aiLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.askButtonText}>
                                {aiModalType === "explain"
                                    ? "Explain this verse"
                                    : aiModalType === "reflect"
                                    ? "Get reflection"
                                    : "Ask question"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {aiResponse ? (
                        <View style={styles.aiResponseContainer}>
                            <Text style={styles.aiResponseTitle}>
                                AI Response:
                            </Text>
                            <Text style={styles.aiResponseText}>
                                {aiResponse}
                            </Text>
                        </View>
                    ) : null}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={colors?.primary || "#2E8B57"}
                    />
                    <Text style={styles.loadingText}>Loading Surah...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            {renderControls()}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Basmala
                {surahNumber !== 1 && surahNumber !== 9 && (
                    <View style={styles.basmalaContainer}>
                        <Text style={styles.basmalaText}>
                            [translate:بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ]
                        </Text>
                    </View>
                )} */}

                {/* Verses */}
                {surah?.verses?.map((verse, index) =>
                    renderVerseItem(verse, index)
                )}
            </ScrollView>

            {renderAIModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    backButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
    },
    completeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    completeButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    progressSection: {
        marginTop: 8,
    },
    progressText: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 14,
        marginBottom: 8,
        textAlign: "center",
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#DAA520",
        borderRadius: 2,
    },
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    controlButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
    },
    controlButtonText: {
        fontSize: 14,
        color: "#333",
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
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        justifyContent: "center",
    },
    fontButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    fontSizeText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    basmalaContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    basmalaText: {
        fontSize: 20,
        color: colors?.primary || "#2E8B57",
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
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    verseContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    readVerse: {
        backgroundColor: "#f0f8f0",
        borderLeftWidth: 4,
        borderLeftColor: "#4CAF50",
    },
    favoritedVerse: {
        backgroundColor: "#fff8e1",
        borderLeftWidth: 4,
        borderLeftColor: "#FFC107",
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
        backgroundColor: colors?.primary || "#2E8B57",
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
        color: "#4CAF50",
    },
    verseContent: {
        marginBottom: 12,
    },
    arabicText: {
        fontSize: 18,
        lineHeight: 32,
        color: "#333",
        textAlign: "right",
        marginBottom: 12,
    },
    translationText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#666",
        fontStyle: "italic",
    },
    verseFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    verseInfo: {
        fontSize: 12,
        color: "#888",
    },
    aiButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors?.primary || "#2E8B57",
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
        backgroundColor: colors?.primary || "#2E8B57",
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
