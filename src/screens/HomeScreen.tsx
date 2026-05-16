import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing } from '@/theme/theme';
import type { Difficulty } from '@/logic/generator';

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy', label: 'Easy', desc: '24 clues', color: '#10b981' },
  { key: 'medium', label: 'Medium', desc: '18 clues', color: '#f59e0b' },
  { key: 'hard', label: 'Hard', desc: '14 clues', color: '#ef4444' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest, isAdmin, signOut, continueAsGuest } = useAuth();

  const isLoggedIn = !!user;
  const hasSession = isLoggedIn || isGuest;

  function handlePlay(difficulty: Difficulty) {
    if (!hasSession) continueAsGuest();
    router.push({ pathname: '/(game)', params: { difficulty } });
  }

  function handleAuthPress() {
    if (isLoggedIn) {
      signOut();
    } else {
      router.push('/(auth)/login');
    }
  }

  const displayName = isLoggedIn
    ? (user?.user_metadata?.user_name ??
      user?.user_metadata?.name ??
      user?.email?.split('@')[0] ??
      'Player')
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.topBar}>
        {isAdmin && (
          <TouchableOpacity onPress={() => router.push('/(game)/admin')}>
            <Text style={styles.adminLink}>Admin</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {displayName && <Text style={styles.topBarName}>{displayName}</Text>}
        <TouchableOpacity style={styles.authButton} onPress={handleAuthPress}>
          <Text style={styles.authButtonText}>{isLoggedIn ? 'Sign out' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.logo}>SudokuZ</Text>
        <Text style={styles.tagline}>6×6 Sudoku. Clean. Fast.</Text>
      </View>

      <View style={styles.difficultySection}>
        <Text style={styles.sectionLabel}>Select difficulty</Text>
        <View style={styles.cards}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={styles.card}
              onPress={() => handlePlay(d.key)}
              activeOpacity={0.75}
            >
              <View style={[styles.cardDot, { backgroundColor: d.color }]} />
              <Text style={styles.cardLabel}>{d.label}</Text>
              <Text style={styles.cardDesc}>{d.desc}</Text>
              <View style={[styles.playBtn, { borderColor: d.color }]}>
                <Text style={[styles.playBtnText, { color: d.color }]}>Play</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLoggedIn
            ? `Signed in as ${displayName}`
            : isGuest
              ? 'Playing as guest — sign in to save progress'
              : 'No account needed to play'}
        </Text>
        {!isLoggedIn && (
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Create free account →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  adminLink: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
    marginRight: spacing.md,
  },
  topBarName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  authButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.controlBorder,
  },
  authButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  difficultySection: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  playBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
});
