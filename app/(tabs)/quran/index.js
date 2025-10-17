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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuran } from "../../../src/hooks/useQuran";
import { colors } from "../../../src/constants/theme";
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
                <Text style={styles.headerTitle}>Holy Quran</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)/quran/stats")}
                    style={styles.statsButton}
                >
                    <Text style={styles.statsButtonText}>📊</Text>
                </TouchableOpacity>
            </View>

            {progress && (
                <View style={styles.progressSection}>
                    <Text style={styles.progressText}>
                        {progress.totalVersesRead || 0} verses read •{" "}
                        {progress.readingStreak?.current || 0} day streak
                    </Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(
                                        ((progress.totalVersesRead || 0) /
                                            6236) *
                                            100,
                                        100
                                    )}%`,
                                },
                            ]}
                        />
                    </View>
                </View>
            )}
        </LinearGradient>
    );

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search Surahs by name or number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
            />
        </View>
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
                    <Text style={styles.loadingText}>Loading Surahs...</Text>
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
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={refreshSurahs}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            {renderSearchBar()}

            <FlatList
                data={filteredSurahs}
                renderItem={renderSurahItem}
                keyExtractor={(item) => item.number.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
};

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
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    statsButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    statsButtonText: {
        fontSize: 16,
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
    searchContainer: {
        padding: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    searchInput: {
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        fontSize: 16,
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
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: colors?.primary || "#2E8B57",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    listContent: {
        padding: 16,
    },
    surahCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    completedSurah: {
        backgroundColor: "#f0f8f0",
        borderLeftWidth: 4,
        borderLeftColor: "#4CAF50",
    },
    surahHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    surahNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors?.primary || "#2E8B57",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    surahNumberText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    surahInfo: {
        flex: 1,
    },
    surahName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    surahTranslation: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    surahMeta: {
        fontSize: 12,
        color: "#888",
    },
    surahActions: {
        alignItems: "flex-end",
    },
    completedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    completedText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    arabicName: {
        fontSize: 16,
        color: "#333",
        textAlign: "right",
        fontWeight: "600",
    },
    separator: {
        height: 12,
    },
});

export default QuranListScreen;
