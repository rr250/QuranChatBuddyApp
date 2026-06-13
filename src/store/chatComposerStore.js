import { create } from "zustand";

export const useChatComposerStore = create((set, get) => ({
    draft: "",
    pendingMessage: null,
    setDraft: (draft) => set({ draft }),
    queueMessage: (message) => set({ pendingMessage: message, draft: "" }),
    consumePendingMessage: () => {
        const message = get().pendingMessage;
        if (message) set({ pendingMessage: null });
        return message;
    },
    clearDraft: () => set({ draft: "" }),
}));
