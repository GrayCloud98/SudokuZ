import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, radius } from '@/theme/theme';

export default function LoginScreen() {
  const { signIn, signInWithGitHub, signInWithGoogle, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setError(null);
      setIsLoading(true);
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGitHub() {
    try {
      setError(null);
      await signInWithGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign in failed');
    }
  }

  async function handleGoogle() {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    }
  }

  return (
    <View style={styles.container}>
      <Head>
        <title>Sign in · SudokuZ</title>
      </Head>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
        <Feather name="arrow-left" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.logo}>SudokuZ</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to save your progress</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={colors.textError} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.primaryBtnLoading]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Sign in</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.oauthRow}>
        <TouchableOpacity style={styles.oauthBtn} onPress={handleGitHub} activeOpacity={0.75}>
          <Feather name="github" size={18} color={colors.textPrimary} />
          <Text style={styles.oauthText}>GitHub</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.oauthBtn} onPress={handleGoogle} activeOpacity={0.75}>
          <Text style={styles.oauthIcon}>G</Text>
          <Text style={styles.oauthText}>Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.footerLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing['2xl'],
    paddingTop: spacing['2xl'],
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorSubtle,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: colors.textError,
    flex: 1,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  input: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryBtnLoading: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  oauthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  oauthIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285f4',
  },
  oauthText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
});
