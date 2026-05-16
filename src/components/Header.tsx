import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import type { Difficulty } from '../logic/generator';

interface Props {
  difficulty: Difficulty;
  time: string;
  mistakes: number;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export function Header({ difficulty, time, mistakes }: Props) {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!user;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
        <Feather name="arrow-left" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={[styles.diffBadge, { borderColor: DIFFICULTY_COLORS[difficulty] }]}>
          <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[difficulty] }]}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </View>
        <Text style={styles.timer}>{time}</Text>
        {mistakes > 0 && (
          <Text style={styles.mistakes}>
            {'✕'.repeat(mistakes)} mistake{mistakes !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {isAdmin && (
          <TouchableOpacity onPress={() => router.push('/(game)/admin')} style={styles.iconBtn}>
            <Feather name="settings" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => (isLoggedIn ? signOut() : router.push('/(auth)/login'))}
        >
          <Feather name={isLoggedIn ? 'log-out' : 'user'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  diffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timer: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  mistakes: {
    fontSize: 12,
    color: colors.textError,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
