import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as G from '../logic/generator';
import { colors, spacing, radius } from '../theme/theme';

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

export function WinScreen({ onNewGame, onWin, time, difficulty, mistakes }: Props) {
  useEffect(() => {
    onWin();
  }, []);

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="award" size={40} color="#f59e0b" />
          </View>

          <Text style={styles.title}>Puzzle Solved!</Text>

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
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onNewGame(NEXT_DIFFICULTIES[difficulty])}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Next puzzle</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>

            <View style={styles.diffRow}>
              {(['easy', 'medium', 'hard'] as G.Difficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.diffBtn, d === difficulty && styles.diffBtnActive]}
                  onPress={() => onNewGame(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.diffBtnText, d === difficulty && styles.diffBtnTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    color: colors.textPrimary,
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
  primaryBtnText: {
    fontSize: 16,
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
  diffBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  diffBtnTextActive: {
    color: colors.accent,
  },
});
