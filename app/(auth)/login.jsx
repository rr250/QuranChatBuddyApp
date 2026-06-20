import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
    Button,
    TextInput,
    Divider,
    HelperText,
    Text,
} from "react-native-paper";
import { useAuthStore } from "../../src/store/authStore";
import { AuthScreenLayout } from "../../src/components/auth/AuthScreenLayout";
import { authStyles as styles } from "../../src/components/auth/authStyles";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { SocialLoginButtons } from "../../src/components/auth/SocialLoginButtons";
import { validateEmail, validatePassword } from "../../src/utils/validation";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const { signInWithEmail, loading, error } = useAuthStore();

    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password),
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            await signInWithEmail(email.trim(), password);
            router.replace("/(tabs)");
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <>
            <AuthScreenLayout
                title="Welcome Back"
                subtitle="Sign in to your account"
                showHomeButton
            >
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.email}
                    left={<TextInput.Icon icon="email" />}
                />
                <HelperText type="error" visible={!!errors.email}>
                    {errors.email}
                </HelperText>

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                        />
                    }
                />
                <HelperText type="error" visible={!!errors.password}>
                    {errors.password}
                </HelperText>

                {error ? (
                    <HelperText type="error" visible style={styles.errorText}>
                        {error}
                    </HelperText>
                ) : null}

                <Button
                    mode="text"
                    onPress={() => router.push("/(auth)/forgot-password")}
                    style={styles.forgotButton}
                    labelStyle={styles.forgotButtonText}
                >
                    Forgot Password?
                </Button>

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    disabled={loading}
                    style={styles.primaryButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                >
                    Sign In
                </Button>

                <Divider style={styles.divider} />
                {/* <Text style={styles.orText}>Or continue with</Text>

                <SocialLoginButtons mode="signIn" /> */}

                <View style={styles.linkRow}>
                    <Button mode="text" labelStyle={styles.linkText} disabled>
                        Don't have an account?
                    </Button>
                    <Button
                        mode="text"
                        onPress={() => router.push("/(auth)/register")}
                        labelStyle={styles.linkButtonText}
                    >
                        Sign Up
                    </Button>
                </View>
            </AuthScreenLayout>
            <LoadingOverlay visible={loading} />
        </>
    );
}
