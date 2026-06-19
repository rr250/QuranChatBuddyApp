import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { GlassSurface } from "../ui/Glass";
import { getDailyVerse } from "../../utils/dailyQuran";
import { usePaywallAction } from "../../hooks/usePaywallAction";
import { VerseShareCard } from "./VerseShareCard";
import { shareVerse } from "../../utils/shareVerse";
import { openChatWithPrompt } from "../../utils/openChatWithPrompt";
import { buildExplainVersePrompt } from "../../utils/verseChatPrompts";

export const QuranVerseCard = ({ placement = null }) => {
    const { withPaywallCheck } = usePaywallAction();
    const paywallOpts = placement ? { placement } : {};
    const shareRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    const currentVerse = useMemo(() => getDailyVerse(0), []);

    const handleShare = async () => {
        if (!currentVerse || sharing) return;

        try {
            setSharing(true);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await shareVerse(shareRef, currentVerse);
        } catch (error) {
            console.error("Error sharing verse:", error);
        } finally {
            setSharing(false);
        }
    };

    const handleAskAI = () => {
        openChatWithPrompt(buildExplainVersePrompt(currentVerse));
    };

    if (!currentVerse) return null;

    return (
        <>
            <VerseShareCard ref={shareRef} verse={currentVerse} />

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
                    </View>

                    <Text style={styles.arabicText}>{currentVerse.arabicText}</Text>
                    <Text style={styles.translation}>
                        &quot;{currentVerse.translation}&quot;
                    </Text>
                    <Text style={styles.reference}>— {currentVerse.reference}</Text>

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={withPaywallCheck(handleAskAI, paywallOpts)}
                            textColor="#fff"
                            icon="robot-outline"
                            style={styles.actionButton}
                        >
                            Ask QCB
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={withPaywallCheck(handleShare, paywallOpts)}
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
            </GlassSurface>
        </>
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
    actions: {
        flexDirection: "row",
        justifyContent: "center",
        gap: theme.spacing.sm,
        flexWrap: "wrap",
    },
    actionButton: {
        minWidth: 120,
    },
});
