// src/screens/QuranListScreen.js - Main Quran Surahs list
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from "react-native";
import { ScreenShell, screenContentPadding } from "../../../src/components/navigation/ScreenShell";
import { glass } from "../../../src/constants/glass";
import { theme } from "../../../src/constants/theme";
import { useQuran } from "../../../src/hooks/useQuran";
import { useRouter } from "expo-router";

const QuranListScreen = () => {
    const router = useRouter();
    const { surahs, loading, error, user, progress, refreshSurahs } =
        useQuran();
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSurahs, setFilteredSurahs] = useState([]);

    // Filter Surahs based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSurahs(surahs);
        } else {
            const filtered = surahs.filter(
                (surah) =>
                    surah.englishName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    surah.englishNameTranslation
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    surah.number.toString().includes(searchQuery)
            );
            setFilteredSurahs(filtered);
        }
    }, [surahs, searchQuery]);

    const handleSurahPress = (surah) => {
        if (!user) {
            Alert.alert(
                "Sign In Required",
                "Please sign in to read the Quran and track your progress.",
                [{ text: "OK" }]
            );
            return;
        }

        // navigation.navigate("SurahReader", {
        //     surahNumber: surah.number,
        //     surahName: surah.englishName,
        // });
        router.push({
            pathname: "(tabs)/quran/reader",
            params: { surahNumber: surah.number, surahName: surah.englishName },
        });
    };

    const renderSurahItem = ({ item: surah }) => {
        const isCompleted =
            progress?.completedSurahs?.includes(surah.number) || false;

        return (
            <TouchableOpacity
                style={[styles.surahCard, isCompleted && styles.completedSurah]}
                onPress={() => handleSurahPress(surah)}
                activeOpacity={0.7}
            >
                <View style={styles.surahHeader}>
                    <View style={styles.surahNumber}>
                        <Text style={styles.surahNumberText}>
                            {surah.number}
                        </Text>
                    </View>

                    <View style={styles.surahInfo}>
                        <Text style={styles.surahName}>
                            {surah.englishName}
                        </Text>
                        <Text style={styles.surahTranslation}>
                            {surah.englishNameTranslation}
                        </Text>
                        <Text style={styles.surahMeta}>
                            {surah.numberOfAyahs} verses •{" "}
                            {surah.revelationType}
                        </Text>
                    </View>

                    <View style={styles.surahActions}>
                        {isCompleted && (
                            <View style={styles.completedBadge}>
                                <Text style={styles.completedText}>✓</Text>
                            </View>
                        )}
                        <Text style={styles.arabicName}>{surah.name}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const progressSubtitle = progress
        ? `${progress.totalVersesRead ?? 0} verses read · ${progress.readingStreak?.current ?? 0} day streak`
        : "114 surahs · instant offline reading";

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search surahs..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="rgba(255,255,255,0.5)"
            />
        </View>
    );

    if (loading) {
        return (
            <ScreenShell title="Holy Quran" subtitle="Loading surahs...">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading Surahs...</Text>
                </View>
            </ScreenShell>
        );
    }

    if (error) {
        return (
            <ScreenShell title="Holy Quran" subtitle="Something went wrong">
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshSurahs}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </ScreenShell>
        );
    }

    return (
        <ScreenShell title="Holy Quran" subtitle={progressSubtitle}>
            {renderSearchBar()}
            <FlatList
                data={filteredSurahs}
                renderItem={renderSurahItem}
                keyExtractor={(item) => item.number.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.listContent, screenContentPadding]}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </ScreenShell>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    searchInput: {
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        borderRadius: 22,
        fontSize: 16,
        color: "#fff",
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
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
    },
    separator: { height: 10 },
    surahCard: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    completedSurah: {
        borderColor: theme.colors.secondary,
    },
    surahHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    surahNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    surahNumberText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    surahInfo: { flex: 1 },
    surahName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    surahTranslation: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        marginBottom: 4,
    },
    surahMeta: {
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
    },
    surahActions: { alignItems: "flex-end" },
    completedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.secondary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    completedText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    arabicName: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        textAlign: "right",
        fontWeight: "600",
    },
});

export default QuranListScreen;
