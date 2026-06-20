// src/components/chat/MessageBubble.js
import React, { useState } from "react";
import logger from "../../services/logger";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { colors } from "../../theme";
import { TypewriterText } from "../common/TypewriterText";

export const MessageBubble = ({ message, onShare, onTypewriterComplete }) => {
    const shouldAnimate = !message.isUser && message.animate;
    const [animationDone, setAnimationDone] = useState(!shouldAnimate);

    const handleTypewriterComplete = () => {
        setAnimationDone(true);
        onTypewriterComplete?.();
    };
    const handleShare = async () => {
        if (onShare) {
            onShare(message.text);
        } else {
            try {
                await Share.share({
                    message: message.text,
                    title: "Islamic Guidance from Quran Chat Buddy",
                });
            } catch (error) {
                logger.error("Error sharing message:", error);
            }
        }
    };

    return (
        <View
            style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
            ]}
        >
            <TouchableOpacity
                onLongPress={!message.isUser ? handleShare : undefined}
                activeOpacity={message.isUser ? 1 : 0.8}
                style={[
                    styles.messageContent,
                    message.isUser ? styles.userContent : styles.aiContent,
                    message.isError && styles.errorContent,
                ]}
            >
                {shouldAnimate && !animationDone ? (
                    <TypewriterText
                        text={message.text}
                        mode={message.text?.length > 80 ? "word" : "char"}
                        style={[
                            styles.messageText,
                            message.isUser ? styles.userText : styles.aiText,
                            message.isError && styles.errorText,
                        ]}
                        onComplete={handleTypewriterComplete}
                    />
                ) : (
                    <Text
                        style={[
                            styles.messageText,
                            message.isUser ? styles.userText : styles.aiText,
                            message.isError && styles.errorText,
                        ]}
                    >
                        {message.text}
                    </Text>
                )}
                {animationDone ? (
                <Text
                    style={[
                        styles.timestamp,
                        message.isUser
                            ? styles.userTimestamp
                            : styles.aiTimestamp,
                    ]}
                >
                    {(() => {
                        if (!message.timestamp) return "";

                        // Convert string timestamp to Date object if needed
                        const date =
                            typeof message.timestamp === "string"
                                ? new Date(message.timestamp)
                                : message.timestamp;
                        // Check if it's a valid date
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            const now = new Date();
                            const isToday =
                                date.toDateString() === now.toDateString();

                            if (isToday) {
                                // Show only time for today's messages
                                return date.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                            } else {
                                // Show date and time for older messages
                                return date.toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                            }
                        }

                        return "";
                    })()}
                </Text>
                ) : null}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    messageBubble: {
        maxWidth: "85%",
        marginVertical: 4,
        marginHorizontal: 12,
    },
    userBubble: {
        alignSelf: "flex-end",
    },
    aiBubble: {
        alignSelf: "flex-start",
    },
    messageContent: {
        padding: 14,
        borderRadius: 20,
    },
    userContent: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 8,
    },
    aiContent: {
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        borderBottomLeftRadius: 8,
    },
    errorContent: {
        backgroundColor: "rgba(255,205,210,0.2)",
        borderColor: "rgba(255,205,210,0.4)",
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 4,
    },
    userText: {
        color: "white",
    },
    aiText: {
        color: "#fff",
    },
    errorText: {
        color: "#ffcdd2",
    },
    timestamp: {
        fontSize: 11,
        opacity: 0.7,
        marginTop: 4,
    },
    userTimestamp: {
        color: "rgba(255,255,255,0.8)",
        textAlign: "right",
    },
    aiTimestamp: {
        color: "rgba(255,255,255,0.65)",
        textAlign: "left",
    },
});
