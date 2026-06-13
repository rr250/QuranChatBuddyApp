import React, { useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import { router } from "expo-router";
import { AuthService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";

export const SocialLoginButtons = ({ mode = "signIn" }) => {
    const {
        setUser,
        setLoading,
        setError,
        processGoogleLinking,
    } = useAuthStore();

    const isLinkMode = mode === "link";
    const { request, response, promptAsync } = AuthService.useGoogleAuth();

    useEffect(() => {
        if (response?.type === "success") {
            handleGoogleResponse(response);
        } else if (response?.type === "error") {
            setError("Google sign-in failed");
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
            console.error("Google auth error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            if (!request) {
                Alert.alert(
                    "Error",
                    "Google sign-in is not ready yet. Please try again.",
                );
                return;
            }
            await promptAsync();
        } catch (error) {
            console.error("Google sign-in initiation error:", error);
            Alert.alert("Error", "Failed to start Google sign-in");
        }
    };

    return (
        <View style={styles.container}>
            <Button
                mode="outlined"
                onPress={handleGoogleLogin}
                disabled={!request}
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
