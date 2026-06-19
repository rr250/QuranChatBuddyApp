import { router } from "expo-router";
import { useChatComposerStore } from "../store/chatComposerStore";

export function openChatWithPrompt(message) {
    const trimmed = message?.trim();
    if (!trimmed) return;

    useChatComposerStore.getState().queueMessage(trimmed);
    router.push("/(tabs)/chat");
}
