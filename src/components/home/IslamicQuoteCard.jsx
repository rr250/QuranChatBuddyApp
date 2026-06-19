import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    Dimensions,
} from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../../constants/theme";
import { GlassDashboardCard } from "../ui/GlassDashboardCard";
import { glass } from "../../constants/glass";
import { usePaywallAction } from "../../hooks/usePaywallAction";
import { getDailyVerseBatch, getDateKey } from "../../utils/dailyQuran";
import { aiService } from "../../services/aiService";
import { VerseShareCard } from "../quran/VerseShareCard";
import { shareVerse } from "../../utils/shareVerse";
import { openChatWithPrompt } from "../../utils/openChatWithPrompt";
import { buildExplainVersePrompt } from "../../utils/verseChatPrompts";

const CAROUSEL_COUNT = 5;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_HORIZONTAL_INSET = theme.spacing.md * 2 + theme.spacing.lg * 2;
const CARD_WIDTH = SCREEN_WIDTH - SLIDE_HORIZONTAL_INSET;

const categoryCacheKey = (verse) =>
    `verse_category_${getDateKey()}_${verse.surah}_${verse.ayah}`;

const QuoteSlide = ({
    item,
    category,
    loadingCategory,
    paywallOpts,
    withPaywallCheck,
    onShare,
    sharing,
}) => (
    <View style={[styles.slide, { width: CARD_WIDTH }]}>
        <View style={styles.badge}>
            {loadingCategory ? (
                <ActivityIndicator size={12} color={theme.colors.secondary} />
            ) : (
                <Text style={styles.badgeText}>{category}</Text>
            )}
        </View>

        <Text style={styles.arabicText}>{item.arabicText}</Text>
        <Text style={styles.quoteText}>&quot;{item.translation}&quot;</Text>
        <Text style={styles.source}>— {item.reference}</Text>

        <View style={styles.actions}>
            <Button
                mode="outlined"
                onPress={withPaywallCheck(
                    () =>
                        openChatWithPrompt(buildExplainVersePrompt(item)),
                    paywallOpts,
                )}
                textColor="#fff"
                icon="robot-outline"
                style={styles.actionButton}
            >
                Ask QCB
            </Button>
            <Button
                mode="outlined"
                onPress={withPaywallCheck(
                    () => onShare(item, category),
                    paywallOpts,
                )}
                textColor="#fff"
                icon="share"
                loading={sharing}
                disabled={sharing}
                style={styles.actionButton}
            >
                Share
            </Button>
        </View>
    </View>
);

export const IslamicQuoteCard = ({ placement = null }) => {
    const { withPaywallCheck } = usePaywallAction();
    const paywallOpts = placement ? { placement } : {};
    const shareRef = useRef(null);

    const verses = useMemo(() => getDailyVerseBatch(CAROUSEL_COUNT), []);
    const [activeIndex, setActiveIndex] = useState(0);
    const [categories, setCategories] = useState({});
    const [shareTarget, setShareTarget] = useState(null);
    const [sharing, setSharing] = useState(false);

    const loadCategory = useCallback(async (verse) => {
        if (!verse) return "Quranic Wisdom";

        const key = categoryCacheKey(verse);
        const cached = await AsyncStorage.getItem(key);
        if (cached) return cached;

        const category = await aiService.getVerseCategory(
            verse.translation,
            verse.reference,
        );
        await AsyncStorage.setItem(key, category);
        return category;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            const entries = await Promise.all(
                verses.map(async (verse) => {
                    const category = await loadCategory(verse);
                    return [categoryCacheKey(verse), category];
                }),
            );

            if (!cancelled) {
                setCategories(Object.fromEntries(entries));
            }
        };

        if (verses.length) {
            loadCategories();
        }

        return () => {
            cancelled = true;
        };
    }, [verses, loadCategory]);

    const handleShare = async (verse, category) => {
        if (sharing) return;

        try {
            setSharing(true);
            setShareTarget({ verse, category });
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await shareVerse(shareRef, verse, {
                title: "Today's Reflection",
                category,
            });
        } catch (error) {
            console.error("Error sharing reflection:", error);
        } finally {
            setSharing(false);
            setShareTarget(null);
        }
    };

    const onScroll = (event) => {
        const index = Math.round(
            event.nativeEvent.contentOffset.x / CARD_WIDTH,
        );
        if (index !== activeIndex && index >= 0 && index < verses.length) {
            setActiveIndex(index);
        }
    };

    if (!verses.length) return null;

    return (
        <>
            <VerseShareCard
                ref={shareRef}
                verse={shareTarget?.verse ?? verses[activeIndex]}
                category={
                    shareTarget?.category ??
                    categories[categoryCacheKey(verses[activeIndex])]
                }
            />

            <GlassDashboardCard>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MaterialCommunityIcons
                            name="format-quote-close"
                            size={22}
                            color="#fff"
                        />
                        <Text style={styles.title}>Today&apos;s Reflections</Text>
                    </View>
                </View>

                <FlatList
                    data={verses}
                    keyExtractor={(item) => `${item.surah}:${item.ayah}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_WIDTH}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onScroll}
                    style={styles.carousel}
                    contentContainerStyle={styles.carouselContent}
                    renderItem={({ item }) => (
                        <QuoteSlide
                            item={item}
                            category={
                                categories[categoryCacheKey(item)] ?? "Quranic Wisdom"
                            }
                            loadingCategory={!categories[categoryCacheKey(item)]}
                            paywallOpts={paywallOpts}
                            withPaywallCheck={withPaywallCheck}
                            onShare={handleShare}
                            sharing={sharing}
                        />
                    )}
                />

                <View style={styles.dots}>
                    {verses.map((verse, index) => (
                        <View
                            key={`${verse.surah}:${verse.ayah}`}
                            style={[
                                styles.dot,
                                index === activeIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            </GlassDashboardCard>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
        color: "#fff",
    },
    slide: {
        width: CARD_WIDTH,
    },
    carousel: {
        marginHorizontal: -theme.spacing.lg,
    },
    carouselContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: glass.backgroundStrong,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: theme.spacing.md,
        minHeight: 24,
        justifyContent: "center",
    },
    badgeText: {
        color: theme.colors.secondary,
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    arabicText: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: "center",
        color: "#fff",
        marginBottom: theme.spacing.md,
    },
    quoteText: {
        fontSize: 15,
        lineHeight: 22,
        color: "rgba(255,255,255,0.9)",
        fontStyle: "italic",
        textAlign: "center",
        marginBottom: theme.spacing.sm,
        flexShrink: 1,
        width: "100%",
    },
    source: {
        textAlign: "center",
        color: theme.colors.secondary,
        marginBottom: theme.spacing.md,
        width: "100%",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "center",
        gap: theme.spacing.sm,
        flexWrap: "wrap",
        width: "100%",
    },
    actionButton: {
        minWidth: 120,
    },
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        marginTop: theme.spacing.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.35)",
    },
    dotActive: {
        backgroundColor: "#fff",
        width: 18,
    },
});
