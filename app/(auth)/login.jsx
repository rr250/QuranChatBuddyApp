import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, TextInput, Text, Divider, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { theme } from '../../src/constants/theme';
import { LoadingOverlay } from '../../src/components/common/LoadingOverlay';
import { SocialLoginButtons } from '../../src/components/auth/SocialLoginButtons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { signInWithEmail, loading, error } = useAuthStore();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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

              {error && (
                <HelperText type="error" visible={true} style={styles.errorText}>
                  {error}
                </HelperText>
              )}

              <Button
                mode="text"
                onPress={handleForgotPassword}
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
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>

              <Divider style={styles.divider} />
              <Text style={styles.orText}>Or continue with</Text>

              <SocialLoginButtons />

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={handleSignUp}
                  labelStyle={styles.signUpButtonText}
                >
                  Sign Up
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
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.xl,
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
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: '#ffcdd2',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotButtonText: {
    color: 'white',
    fontSize: 14,
  },
  loginButton: {
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  signUpText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  signUpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});