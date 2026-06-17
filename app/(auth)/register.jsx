import React, { useState } from "react";
import { View, Linking } from "react-native";
import { router } from "expo-router";
import {
    Button,
    TextInput,
    Divider,
    HelperText,
    Checkbox,
    Text,
} from "react-native-paper";
import { useAuthStore } from "../../src/store/authStore";
import { AuthScreenLayout } from "../../src/components/auth/AuthScreenLayout";
import { authStyles as styles } from "../../src/components/auth/authStyles";
import { LoadingOverlay } from "../../src/components/common/LoadingOverlay";
import { SocialLoginButtons } from "../../src/components/auth/SocialLoginButtons";
import {
    validateEmail,
    validateDisplayName,
    validateStrongPassword,
    validateConfirmPassword,
} from "../../src/utils/validation";
import { APP_LINKS } from "../../src/constants/appLinks";

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState({});

    const {
        signUpWithEmail,
        linkWithEmailPassword,
        isAnonymous,
        loading,
        error,
    } = useAuthStore();

    const validateForm = () => {
        const newErrors = {
            displayName: validateDisplayName(formData.displayName),
            email: validateEmail(formData.email),
            password: validateStrongPassword(formData.password),
            confirmPassword: validateConfirmPassword(
                formData.password,
                formData.confirmPassword,
            ),
            terms: acceptedTerms ? null : "You must accept the terms and conditions",
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        try {
            const { email, password, displayName } = formData;
            const trimmedEmail = email.trim();
            const trimmedName = displayName.trim();

            if (isAnonymous) {
                await linkWithEmailPassword(trimmedEmail, password, trimmedName);
            } else {
                await signUpWithEmail(trimmedEmail, password, trimmedName);
            }
            router.replace("/(tabs)");
        } catch (err) {
            console.error("Sign up error:", err);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    return (
        <>
            <AuthScreenLayout
                title={isAnonymous ? "Create Your Account" : "Create Account"}
                subtitle={
                    isAnonymous
                        ? "Link your guest progress to a permanent account"
                        : "Join our Islamic community"
                }
                compactHeader
                showHomeButton
            >
                <TextInput
                    label="Full Name"
                    value={formData.displayName}
                    onChangeText={(value) => handleInputChange("displayName", value)}
                    autoCapitalize="words"
                    autoComplete="name"
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.displayName}
                    left={<TextInput.Icon icon="account" />}
                />
                <HelperText type="error" visible={!!errors.displayName}>
                    {errors.displayName}
                </HelperText>

                <TextInput
                    label="Email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
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
                    value={formData.password}
                    onChangeText={(value) => handleInputChange("password", value)}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
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

                <TextInput
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                        handleInputChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.confirmPassword}
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                        <TextInput.Icon
                            icon={showConfirmPassword ? "eye-off" : "eye"}
                            onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        />
                    }
                />
                <HelperText type="error" visible={!!errors.confirmPassword}>
                    {errors.confirmPassword}
                </HelperText>

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        status={acceptedTerms ? "checked" : "unchecked"}
                        onPress={() => setAcceptedTerms(!acceptedTerms)}
                        color="white"
                    />
                    <Text style={styles.linkText}>
                        I accept the{" "}
                        <Text
                            style={styles.linkInline}
                            onPress={() => Linking.openURL(APP_LINKS.terms)}
                        >
                            Terms & Conditions
                        </Text>{" "}
                        and{" "}
                        <Text
                            style={styles.linkInline}
                            onPress={() => Linking.openURL(APP_LINKS.privacy)}
                        >
                            Privacy Policy
                        </Text>
                    </Text>
                </View>
                <HelperText type="error" visible={!!errors.terms}>
                    {errors.terms}
                </HelperText>

                {error ? (
                    <HelperText type="error" visible style={styles.errorText}>
                        {error}
                    </HelperText>
                ) : null}

                <Button
                    mode="contained"
                    onPress={handleSignUp}
                    loading={loading}
                    disabled={loading}
                    style={styles.primaryButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                >
                    {isAnonymous ? "Link Account" : "Create Account"}
                </Button>

                <Divider style={styles.divider} />
                <Text style={styles.orText}>Or sign up with</Text>

                <SocialLoginButtons mode={isAnonymous ? "link" : "signIn"} />

                <View style={styles.linkRow}>
                    <Button mode="text" labelStyle={styles.linkText} disabled>
                        Already have an account?
                    </Button>
                    <Button
                        mode="text"
                        onPress={() => router.push("/(auth)/login")}
                        labelStyle={styles.linkButtonText}
                    >
                        Sign In
                    </Button>
                </View>
            </AuthScreenLayout>
            <LoadingOverlay visible={loading} />
        </>
    );
}
