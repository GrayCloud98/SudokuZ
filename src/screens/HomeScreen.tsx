import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, spacing, USE_NATIVE_DRIVER } from '@/theme/theme';
import { useHover } from '@/hooks/useHover';
import type { Difficulty } from '@/logic/generator';

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy', label: 'Easy', desc: '24 clues · a gentle warm-up', color: '#10b981' },
  { key: 'medium', label: 'Medium', desc: '18 clues · a fair fight', color: '#f59e0b' },
  { key: 'hard', label: 'Hard', desc: '14 clues · bring notes', color: '#ef4444' },
];

// Mini 2×3 grid mark — the shape of a 6×6 sudoku box
const LOGO_TILES = ['3', '1', '6', '2', 'Z', '4'];

function formatBest(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function LogoMark() {
  return (
    <View style={styles.logoMark}>
      {LOGO_TILES.map((tile, i) => {
        const isAccent = tile === 'Z';
        return (
          <View key={i} style={[styles.logoTile, isAccent && styles.logoTileAccent]}>
            <Text style={[styles.logoTileText, isAccent && styles.logoTileTextAccent]}>{tile}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ContinueCard({ difficulty, onPress }: { difficulty: Difficulty; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <Pressable
      style={[styles.continueCard, hovered && styles.continueCardHovered]}
      onPress={onPress}
      {...hoverProps}
    >
      <View style={styles.continueIcon}>
        <Feather name="play" size={18} color={colors.accent} />
      </View>
      <View style={styles.continueBody}>
        <Text style={styles.continueTitle}>Continue puzzle</Text>
        <Text style={styles.continueDesc}>{label} · pick up where you left off</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

function DifficultyCard({
  item,
  best,
  onPress,
}: {
  item: (typeof DIFFICULTIES)[number];
  best: number | null;
  onPress: () => void;
}) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      style={[styles.card, hovered && styles.cardHovered]}
      onPress={onPress}
      {...hoverProps}
    >
      <View style={[styles.cardDot, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{item.label}</Text>
        <Text style={styles.cardDesc}>{item.desc}</Text>
      </View>
      {best !== null && (
        <View style={styles.bestChip}>
          <Feather name="clock" size={11} color={colors.textSecondary} />
          <Text style={styles.bestChipText}>{formatBest(best)}</Text>
        </View>
      )}
      <Feather
        name="chevron-right"
        size={20}
        color={hovered ? colors.textPrimary : colors.textMuted}
      />
    </Pressable>
  );
}

function TopBarButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      style={[styles.authButton, hovered && styles.authButtonHovered]}
      onPress={onPress}
      {...hoverProps}
    >
      <Text style={styles.authButtonText}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest, isAdmin, signOut, continueAsGuest } = useAuth();

  const [savedDifficulty, setSavedDifficulty] = useState<Difficulty | null>(null);
  const [bestTimes, setBestTimes] = useState<Partial<Record<Difficulty, number>>>({});

  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  const isLoggedIn = !!user;
  const hasSession = isLoggedIn || isGuest;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(cardsAnim, { toValue: 1, duration: 420, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedDifficulty(null);
      setBestTimes({});
      return;
    }
    let cancelled = false;

    async function fetchPlayerData() {
      const [saved, progress] = await Promise.all([
        supabase.from('games').select('difficulty').eq('user_id', user!.id).maybeSingle(),
        supabase.from('user_progress').select('difficulty, time_seconds').eq('user_id', user!.id),
      ]);
      if (cancelled) return;

      if (saved.data?.difficulty) setSavedDifficulty(saved.data.difficulty as Difficulty);

      if (progress.data) {
        const best: Partial<Record<Difficulty, number>> = {};
        for (const row of progress.data) {
          const d = row.difficulty as Difficulty;
          if (best[d] === undefined || row.time_seconds < best[d]) best[d] = row.time_seconds;
        }
        setBestTimes(best);
      }
    }

    fetchPlayerData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function handlePlay(difficulty: Difficulty) {
    if (!hasSession) continueAsGuest();
    router.push({ pathname: '/(game)/play', params: { difficulty, fresh: '1' } });
  }

  function handleContinue() {
    router.push({ pathname: '/(game)/play', params: { difficulty: savedDifficulty ?? 'medium' } });
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <View style={styles.topBar}>
            {isAdmin && <TopBarButton label="Admin" onPress={() => router.push('/(game)/admin')} />}
            <View style={{ flex: 1 }} />
            {displayName && <Text style={styles.topBarName}>{displayName}</Text>}
            <TopBarButton
              label={isLoggedIn ? 'Sign out' : 'Sign in'}
              onPress={() => (isLoggedIn ? signOut() : router.push('/(auth)/login'))}
            />
          </View>

          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroAnim,
                transform: [
                  {
                    translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                  },
                ],
              },
            ]}
          >
            <LogoMark />
            <Text style={styles.logo}>SudokuZ</Text>
            <Text style={styles.tagline}>Six numbers. No mercy.</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.difficultySection,
              {
                opacity: cardsAnim,
                transform: [
                  {
                    translateY: cardsAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
                  },
                ],
              },
            ]}
          >
            {savedDifficulty && (
              <ContinueCard difficulty={savedDifficulty} onPress={handleContinue} />
            )}

            <Text style={styles.sectionLabel}>
              {savedDifficulty ? 'Or start fresh' : 'New game'}
            </Text>
            <View style={styles.cards}>
              {DIFFICULTIES.map((d) => (
                <DifficultyCard
                  key={d.key}
                  item={d}
                  best={bestTimes[d.key] ?? null}
                  onPress={() => handlePlay(d.key)}
                />
              ))}
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isLoggedIn
                ? 'Your progress saves automatically'
                : isGuest
                  ? 'Playing as guest — sign in to save progress'
                  : 'No account needed to play'}
            </Text>
            {!isLoggedIn && (
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.footerLink}>Create free account →</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['4xl'],
  },
  topBarName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  authButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.controlBorder,
  },
  authButtonHovered: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSubtle,
  },
  authButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
    gap: spacing.sm,
  },
  logoMark: {
    width: 132,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.lg,
  },
  logoTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTileAccent: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accent,
  },
  logoTileText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textMuted,
  },
  logoTileTextAccent: {
    color: '#fff',
  },
  logo: {
    fontSize: 44,
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  difficultySection: {
    flex: 1,
    gap: spacing.md,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.accentSubtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  continueCardHovered: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(59,130,246,0.22)',
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBody: {
    flex: 1,
    gap: 2,
  },
  continueTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  continueDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  cardHovered: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.surfaceElevated,
    transform: [{ translateY: -1 }],
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 17,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textMuted,
  },
  bestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bestChipText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['3xl'],
  },
  footerText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 13,
    color: colors.accent,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
});
