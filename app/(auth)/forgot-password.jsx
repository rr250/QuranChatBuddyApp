import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, TextInput, HelperText, Text } from "react-native-paper";
import { useAuthStore } from "../../src/store/authStore";
import { AuthScreenLayout } from "../../src/components/auth/AuthScreenLayout";
import { authStyles as styles } from "../../src/components/auth/authStyles";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { validateEmail } from "../../src/utils/validation";
import logger from "../../src/services/logger";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(null);
    const [sent, setSent] = useState(false);
    const { resetPassword, loading, error } = useAuthStore();

    const handleReset = async () => {
        const validationError = validateEmail(email);
        setEmailError(validationError);
        if (validationError) return;

        try {
            await resetPassword(email.trim());
            setSent(true);
        } catch (err) {
            logger.error("Password reset error:", err);
        }
    };

    return (
        <>
            <AuthScreenLayout
                title="Reset Password"
                subtitle="We'll send you a reset link"
                compactHeader
                showHomeButton
            >
                {sent ? (
                    <View>
                        <Text style={styles.subtitle}>
                            Check your email for password reset instructions.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => router.replace("/(auth)/login")}
                            style={styles.primaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            Back to Sign In
                        </Button>
                    </View>
                ) : (
                    <>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            mode="outlined"
                            style={styles.input}
                            error={!!emailError}
                            left={<TextInput.Icon icon="email" />}
                        />
                        <HelperText type="error" visible={!!emailError}>
                            {emailError}
                        </HelperText>

                        {error ? (
                            <HelperText type="error" visible style={styles.errorText}>
                                {error}
                            </HelperText>
                        ) : null}

                        <Button
                            mode="contained"
                            onPress={handleReset}
                            loading={loading}
                            disabled={loading}
                            style={styles.primaryButton}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            Send Reset Link
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => router.back()}
                            labelStyle={styles.linkButtonText}
                        >
                            Back to Sign In
                        </Button>
                    </>
                )}
            </AuthScreenLayout>
            <LoadingOverlay visible={loading} />
        </>
    );
}
