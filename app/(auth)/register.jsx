import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, TextInput, Text, Divider, HelperText, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { LoadingOverlay } from '../../src/components/common/LoadingOverlay';
import { SocialLoginButtons } from '../../src/components/auth/SocialLoginButtons';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const { signUpWithEmail, loading, error } = useAuthStore();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase and lowercase letters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      await signUpWithEmail(
        formData.email.trim(),
        formData.password,
        formData.displayName.trim()
      );
      router.replace('/(auth)/onboarding');
    } catch (err) {
      console.error('Sign up error:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoIcon}>🕌</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our Islamic community</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                label="Full Name"
                value={formData.displayName}
                onChangeText={(value) => handleInputChange('displayName', value)}
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
                onChangeText={(value) => handleInputChange('email', value)}
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
                onChangeText={(value) => handleInputChange('password', value)}
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
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                style={styles.input}
                error={!!errors.confirmPassword}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
              </HelperText>

              {/* Terms and Conditions */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={acceptedTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  color="white"
                />
                <Text style={styles.termsText}>
                  I accept the{' '}
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
              <HelperText type="error" visible={!!errors.terms}>
                {errors.terms}
              </HelperText>

              {error && (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {error}
                </HelperText>
              )}

              <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                style={styles.signUpButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Create Account
              </Button>

              <Divider style={styles.divider} />
              <Text style={styles.orText}>Or sign up with</Text>

              <SocialLoginButtons />

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <Button
                  mode="text"
                  onPress={handleSignIn}
                  labelStyle={styles.signInButtonText}
                >
                  Sign In
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <LoadingOverlay visible={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoIcon: {
    fontSize: 60,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  termsText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: theme.spacing.sm,
  },
  termsLink: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: '#ffcdd2',
  },
  signUpButton: {
    backgroundColor: 'white',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: theme.spacing.md,
  },
  orText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signInText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  signInButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});