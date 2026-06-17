import React from "react";
import { View, Image, ImageBackground, StyleSheet, Text } from "react-native";
import { APP_SHARE_URL } from "../../constants/share";
import { theme } from "../../constants/theme";

const SHARE_WIDTH = 1080;
const SHARE_HEIGHT = 1080;

export const VerseShareCard = React.forwardRef(({ verse, category }, ref) => {
    if (!verse) return null;

    return (
        <View ref={ref} collapsable={false} style={styles.offscreen}>
            <ImageBackground
                source={require("../../../assets/share.png")}
                style={styles.canvas}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <View style={styles.brandRow}>
                        <Image
                            source={require("../../../assets/icon.png")}
                            style={styles.icon}
                        />
                        <Text style={styles.brandText}>Quran Chat Buddy</Text>
                    </View>

                    <View style={styles.verseBlock}>
                        {category ? (
                            <Text style={styles.category}>{category.toUpperCase()}</Text>
                        ) : null}
                        <Text style={styles.arabic}>{verse.arabicText}</Text>
                        <Text style={styles.translation}>
                            &quot;{verse.translation}&quot;
                        </Text>
                        <Text style={styles.reference}>— {verse.reference}</Text>
                    </View>

                    <Text style={styles.url}>{APP_SHARE_URL}</Text>
                </View>
            </ImageBackground>
        </View>
    );
});

VerseShareCard.displayName = "VerseShareCard";

const styles = StyleSheet.create({
    offscreen: {
        position: "absolute",
        left: -9999,
        top: 0,
        width: SHARE_WIDTH,
        height: SHARE_HEIGHT,
        opacity: 1,
    },
    canvas: {
        width: SHARE_WIDTH,
        height: SHARE_HEIGHT,
        justifyContent: "flex-end",
    },
    overlay: {
        flex: 1,
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "rgba(8, 32, 24, 0.45)",
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
        marginTop: 24,
    },
    icon: {
        width: 88,
        height: 88,
        borderRadius: 20,
    },
    brandText: {
        color: "#fff",
        fontSize: 42,
        fontWeight: "700",
    },
    verseBlock: {
        flex: 1,
        justifyContent: "center",
        paddingVertical: 40,
    },
    category: {
        color: theme.colors.secondary,
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: 2,
        marginBottom: 28,
    },
    arabic: {
        color: "#fff",
        fontSize: 52,
        lineHeight: 84,
        textAlign: "center",
        marginBottom: 36,
    },
    translation: {
        color: "rgba(255,255,255,0.95)",
        fontSize: 34,
        lineHeight: 48,
        textAlign: "center",
        fontStyle: "italic",
        marginBottom: 24,
    },
    reference: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 28,
        textAlign: "center",
    },
    url: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
});
