import { useEffect } from "react";
import * as Google from "expo-auth-session/providers/google";
import { getGoogleRedirectUri } from "../utils/googleAuth";

/**
 * Google Sign-In via expo-auth-session (ID token for Firebase).
 * Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID + platform client IDs in .env
 * and matching redirect URI in Google Cloud Console (see getGoogleRedirectUri).
 */
export const useGoogleAuth = () => {
    const redirectUri = getGoogleRedirectUri();

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        webClientId,
        iosClientId,
        androidClientId,
        redirectUri,
    });

    useEffect(() => {
        if (__DEV__) {
            console.log("[Google Auth] redirect URI:", redirectUri);
            console.log("[Google Auth] request ready:", Boolean(request));
        }
    }, [redirectUri, request]);

    const promptGoogleSignIn = () =>
        promptAsync({
            showInRecents: true,
        });

    const isConfigured = Boolean(
        webClientId && (iosClientId || androidClientId),
    );

    return {
        request,
        response,
        promptAsync: promptGoogleSignIn,
        redirectUri,
        isConfigured,
    };
};
