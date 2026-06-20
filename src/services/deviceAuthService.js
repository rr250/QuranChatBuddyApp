import { signInWithCustomToken } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getFirebaseAuth, getFirebaseFunctions } from "./firebase";

const isSignBlobError = (error) => {
    const message = `${error?.message ?? ""} ${error?.code ?? ""}`;
    return (
        message.includes("signBlob") ||
        message.includes("createCustomToken") ||
        message.includes("resolveDeviceAuth failed")
    );
};

export class DeviceAuthService {
    static async checkDeviceRegistration(deviceHash) {
        const functions = getFirebaseFunctions();
        const callable = httpsCallable(functions, "checkDeviceRegistration");
        const result = await callable({ deviceHash });
        return result.data ?? { registered: false, linkedUid: null };
    }

    static async resolveDeviceAuth(deviceHash) {
        try {
            const functions = getFirebaseFunctions();
            const callable = httpsCallable(functions, "resolveDeviceAuth");
            const result = await callable({ deviceHash });
            const data = result.data ?? {};

            if (!data.linkedUid && data.uid) {
                data.linkedUid = data.uid;
            }

            return data;
        } catch (error) {
            if (!deviceHash || !isSignBlobError(error)) {
                throw error;
            }

            const check = await this.checkDeviceRegistration(deviceHash);
            if (!check.registered) {
                throw error;
            }

            return {
                linkedUid: check.linkedUid,
                restoreUnavailable: true,
                needsAnonymousSignIn: false,
            };
        }
    }

    static async registerDeviceAccount(deviceHash) {
        const functions = getFirebaseFunctions();
        const callable = httpsCallable(functions, "registerDeviceAccount");
        const result = await callable({ deviceHash });
        return result.data ?? {};
    }

    static async getMessageUsage(deviceHash) {
        const functions = getFirebaseFunctions();
        const callable = httpsCallable(functions, "getMessageUsage");
        const result = await callable({ deviceHash });
        return result.data ?? {};
    }

    static async signInWithResolvedToken(customToken) {
        const auth = getFirebaseAuth();
        const credential = await signInWithCustomToken(auth, customToken);
        return credential.user;
    }

    static async tryRestoreSession(deviceHash) {
        if (!deviceHash) return null;

        const resolution = await this.resolveDeviceAuth(deviceHash);
        if (!resolution.customToken) return null;

        return this.signInWithResolvedToken(resolution.customToken);
    }

    static isDeviceClaimed(resolution) {
        return Boolean(
            resolution?.linkedUid && !resolution?.needsAnonymousSignIn,
        );
    }
}
