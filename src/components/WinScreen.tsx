import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as G from '../logic/generator';
import { colors, fonts, spacing, radius, USE_NATIVE_DRIVER } from '../theme/theme';
import { useHover } from '../hooks/useHover';

interface Props {
  onNewGame: (difficulty: G.Difficulty) => void;
  onWin: () => void;
  time: string;
  difficulty: G.Difficulty;
  mistakes: number;
}

const NEXT_DIFFICULTIES: Record<G.Difficulty, G.Difficulty> = {
  easy: 'medium',
  medium: 'hard',
  hard: 'hard',
};

const CONFETTI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#a78bfa', '#f87171'];
const CONFETTI_COUNT = 24;

interface ConfettiSpec {
  left: number; // % of screen width
  size: number;
  color: string;
  delay: number;
  duration: number;
  spin: string;
  drift: number;
}

function buildConfetti(): ConfettiSpec[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    left: (i / CONFETTI_COUNT) * 100 + (Math.random() * 6 - 3),
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 700,
    duration: 2200 + Math.random() * 1800,
    spin: `${Math.round(360 + Math.random() * 720)}deg`,
    drift: Math.random() * 80 - 40,
  }));
}

function ConfettiPiece({ spec, screenHeight }: { spec: ConfettiSpec; screenHeight: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: spec.duration,
      delay: spec.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -20,
        left: `${spec.left}%`,
        width: spec.size,
        height: spec.size * 1.6,
        borderRadius: 2,
        backgroundColor: spec.color,
        opacity: progress.interpolate({
          inputRange: [0, 0.05, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, screenHeight + 40],
            }),
          },
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, spec.drift],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', spec.spin],
            }),
          },
        ],
      }}
    />
  );
}

function DifficultyButton({
  d,
  isActive,
  onPress,
}: {
  d: G.Difficulty;
  isActive: boolean;
  onPress: () => void;
}) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      style={[styles.diffBtn, isActive && styles.diffBtnActive, hovered && styles.diffBtnHovered]}
      onPress={onPress}
      {...hoverProps}
    >
      <Text style={[styles.diffBtnText, (isActive || hovered) && styles.diffBtnTextActive]}>
        {d.charAt(0).toUpperCase() + d.slice(1)}
      </Text>
    </Pressable>
  );
}

export function WinScreen({ onNewGame, onWin, time, difficulty, mistakes }: Props) {
  const { height } = useWindowDimensions();
  const confetti = useRef(buildConfetti()).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const { hovered: primaryHovered, hoverProps: primaryHoverProps } = useHover();

  useEffect(() => {
    onWin();
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  const perfect = mistakes === 0;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.overlay}>
        {confetti.map((spec, i) => (
          <ConfettiPiece key={i} spec={spec} screenHeight={height} />
        ))}

        <Animated.View
          style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        >
          <View style={styles.iconWrap}>
            <Feather name="award" size={40} color="#f59e0b" />
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>{perfect ? 'Flawless!' : 'Puzzle solved!'}</Text>
            {perfect && <Text style={styles.subtitle}>Not a single mistake</Text>}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Feather name="clock" size={16} color={colors.textMuted} />
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{time}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Feather name="zap" size={16} color={colors.textMuted} />
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={styles.statValue}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
              <Text style={styles.statLabel}>Mistakes</Text>
              <Text style={styles.statValue}>{mistakes}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, primaryHovered && styles.primaryBtnHovered]}
              onPress={() => onNewGame(NEXT_DIFFICULTIES[difficulty])}
              {...primaryHoverProps}
            >
              <Text style={styles.primaryBtnText}>Next puzzle</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>

            <View style={styles.diffRow}>
              {(['easy', 'medium', 'hard'] as G.Difficulty[]).map((d) => (
                <DifficultyButton
                  key={d}
                  d={d}
                  isActive={d === difficulty}
                  onPress={() => onNewGame(d)}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,17,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing['2xl'],
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.success,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryBtnHovered: {
    backgroundColor: colors.accentDark,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
  diffRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  diffBtnActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSubtle,
  },
  diffBtnHovered: {
    borderColor: colors.accentBorder,
  },
  diffBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  diffBtnTextActive: {
    color: colors.accent,
  },
});
