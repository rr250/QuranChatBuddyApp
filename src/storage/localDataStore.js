import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@qcb/v1";

const path = (userId, key) => `${PREFIX}/${userId}/${key}`;

export const localDataStore = {
    async get(userId, key) {
        if (!userId) return null;
        try {
            const raw = await AsyncStorage.getItem(path(userId, key));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    async set(userId, key, value) {
        if (!userId) return;
        try {
            await AsyncStorage.setItem(path(userId, key), JSON.stringify(value));
        } catch {
            // silent
        }
    },

    async remove(userId, key) {
        if (!userId) return;
        try {
            await AsyncStorage.removeItem(path(userId, key));
        } catch {
            // silent
        }
    },

    async getNested(userId, key, subPath) {
        const root = (await this.get(userId, key)) ?? {};
        if (!subPath) return root;
        return subPath.split("/").reduce((acc, part) => acc?.[part], root) ?? null;
    },

    async setNested(userId, key, subPath, value) {
        const root = { ...((await this.get(userId, key)) ?? {}) };
        const parts = subPath.split("/");
        let cursor = root;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const part = parts[i];
            cursor[part] = { ...(cursor[part] ?? {}) };
            cursor = cursor[part];
        }
        cursor[parts.at(-1)] = value;
        await this.set(userId, key, root);
    },

    async deleteNested(userId, key, subPath) {
        const root = { ...((await this.get(userId, key)) ?? {}) };
        const parts = subPath.split("/");
        let cursor = root;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const part = parts[i];
            if (!cursor[part]) return;
            cursor = cursor[part];
        }
        delete cursor[parts.at(-1)];
        await this.set(userId, key, root);
    },
};
