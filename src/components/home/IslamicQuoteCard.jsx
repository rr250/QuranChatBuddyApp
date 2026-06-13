import React, { useMemo } from "react";
import { View, StyleSheet, Share } from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { GlassDashboardCard } from "../ui/GlassDashboardCard";
import { glass } from "../../constants/glass";

const ISLAMIC_QUOTES = [
    {
        text: "And Allah is the best of planners.",
        source: "Quran 8:30",
        category: "Trust in Allah",
        arabic: "وَاللَّهُ خَيْرُ الْمَاكِرِينَ",
    },
    {
        text: "The believer is not one who eats his fill while his neighbor goes hungry.",
        source: "Prophet Muhammad (ﷺ)",
        category: "Compassion",
    },
    {
        text: "And whoever relies upon Allah - then He is sufficient for him.",
        source: "Quran 65:3",
        category: "Trust in Allah",
        arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    },
    {
        text: "The best of people are those who benefit others.",
        source: "Prophet Muhammad (ﷺ)",
        category: "Service",
    },
];

export const IslamicQuoteCard = () => {
    const initialQuote = useMemo(() => {
        const index = new Date().getDate() % ISLAMIC_QUOTES.length;
        return ISLAMIC_QUOTES[index];
    }, []);

    const [quote, setQuote] = React.useState(initialQuote);

    const handleShare = async () => {
        const shareText = quote.arabic
            ? `${quote.arabic}\n\n"${quote.text}"\n\n— ${quote.source}`
            : `"${quote.text}"\n\n— ${quote.source}`;

        try {
            await Share.share({ message: shareText, title: "Islamic Wisdom" });
        } catch (error) {
            console.error("Error sharing quote:", error);
        }
    };

    const pickNewQuote = () => {
        const next = ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)];
        setQuote(next);
    };

    return (
        <GlassDashboardCard>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                        name="format-quote-close"
                        size={22}
                        color="#fff"
                    />
                    <Text style={styles.title}>Islamic Wisdom</Text>
                </View>
                <IconButton
                    icon="refresh"
                    iconColor="#fff"
                    size={20}
                    onPress={pickNewQuote}
                />
            </View>

            <View style={styles.badge}>
                <Text style={styles.badgeText}>{quote.category}</Text>
            </View>

            {quote.arabic ? (
                <Text style={styles.arabicText}>{quote.arabic}</Text>
            ) : null}

            <Text style={styles.quoteText}>&quot;{quote.text}&quot;</Text>
            <Text style={styles.source}>— {quote.source}</Text>

            <View style={styles.actions}>
                <Button mode="outlined" onPress={handleShare} textColor="#fff" icon="share">
                    Share
                </Button>
            </View>
        </GlassDashboardCard>
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
    badge: {
        alignSelf: "flex-start",
        backgroundColor: glass.backgroundStrong,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: theme.spacing.md,
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
    },
    source: {
        textAlign: "center",
        color: theme.colors.secondary,
        marginBottom: theme.spacing.md,
    },
    actions: { alignItems: "center" },
});
