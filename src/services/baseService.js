import { ref, get, set, update } from "firebase/database";
import { getFirebaseAuth, getFirebaseDatabase } from "./firebase";
import { AuthService } from "./authService";
import { getTodayDateString } from "../utils/date";

export class BaseService {
    constructor() {
        this.auth = null;
        this.database = null;
    }

    initialize() {
        if (!this.auth) {
            this.auth = getFirebaseAuth();
            this.database = getFirebaseDatabase();
        }
    }

    getCurrentUserId() {
        AuthService.initialize();
        const user = AuthService.getCurrentUser();
        if (!user) throw new Error("User not authenticated");
        return user.uid;
    }

    getUserPath(subPath = "") {
        const userId = this.getCurrentUserId();
        return subPath ? `users/${userId}/${subPath}` : `users/${userId}`;
    }

    getScopedPath(scope, subPath = "") {
        const scoped = subPath ? `${scope}/${subPath}` : scope;
        return this.getUserPath(scoped);
    }

    getRef(subPath) {
        this.initialize();
        return ref(this.database, this.getUserPath(subPath));
    }

    getScopedRef(scope, subPath = "") {
        this.initialize();
        return ref(this.database, this.getScopedPath(scope, subPath));
    }

    async getData(subPath) {
        const snapshot = await get(this.getRef(subPath));
        return snapshot.exists() ? snapshot.val() : null;
    }

    async getScopedData(scope, subPath = "") {
        const snapshot = await get(this.getScopedRef(scope, subPath));
        return snapshot.exists() ? snapshot.val() : null;
    }

    async setData(subPath, data) {
        await set(this.getRef(subPath), data);
    }

    async setScopedData(scope, subPath, data) {
        await set(this.getScopedRef(scope, subPath), data);
    }

    async updateData(subPath, data) {
        await update(this.getRef(subPath), data);
    }

    async updateScopedData(scope, subPath, data) {
        await update(this.getScopedRef(scope, subPath), data);
    }

    async existsAt(subPath) {
        const snapshot = await get(this.getRef(subPath));
        return snapshot.exists();
    }

    getTodayDateString() {
        return getTodayDateString();
    }
}
