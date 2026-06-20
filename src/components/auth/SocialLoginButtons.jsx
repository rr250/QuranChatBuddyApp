import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import { router } from "expo-router";
import { AuthService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { theme } from "../../theme";
import logger from "../../services/logger";

export const SocialLoginButtons = ({ mode = "signIn" }) => {
    const {
        setUser,
        setLoading,
        setError,
        processGoogleLinking,
        isAnonymous,
    } = useAuthStore();

    const isLinkMode = mode === "link" || isAnonymous;
    const { request, response, promptAsync, isConfigured } = useGoogleAuth();
    const handledResponseRef = useRef(null);

    useEffect(() => {
        if (!response || handledResponseRef.current === response) return;

        if (response.type === "success") {
            handledResponseRef.current = response;
            handleGoogleResponse(response);
            return;
        }

        if (response.type === "error") {
            handledResponseRef.current = response;
            const message =
                response.error?.message ??
                response.params?.error_description ??
                "Google sign-in failed";
            setError(message);
            Alert.alert("Google Sign-In Failed", message);
            return;
        }

        if (response.type === "dismiss" || response.type === "cancel") {
            handledResponseRef.current = response;
        }
    }, [response]);

    const navigateHome = () => router.replace("/(tabs)");

    const handleGoogleResponse = async (googleResponse) => {
        try {
            setLoading(true);
            const user = isLinkMode
                ? await processGoogleLinking(googleResponse)
                : await AuthService.processGoogleSignIn(googleResponse);
            setUser(user);
            navigateHome();
        } catch (error) {
            logger.error("Google auth error:", error);
            setError(error.message);
            Alert.alert("Google Sign-In Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!isConfigured) {
            Alert.alert(
                "Google Sign-In Not Configured",
                "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in your .env file.\n\n" +
                    AuthService.getGoogleOAuthSetupHint(),
            );
            return;
        }

        if (!request) {
            Alert.alert(
                "Please Wait",
                "Google sign-in is still initializing. Try again in a moment.",
            );
            return;
        }

        try {
            await promptAsync();
        } catch (error) {
            logger.error("Google sign-in initiation error:", error);
            Alert.alert("Error", "Failed to start Google sign-in");
        }
    };

    return (
        <View style={styles.container}>
            <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                disabled={!request || !isConfigured}
                style={styles.socialButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon="google"
            >
                Continue with Google
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: theme.spacing.md },
    socialButton: {
        borderColor: "white",
        borderWidth: 1,
        borderRadius: theme.spacing.md,
    },
    buttonContent: { paddingVertical: theme.spacing.sm },
    buttonLabel: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
    },
});
