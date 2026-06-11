import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '../theme/theme';
import { useHover } from '../hooks/useHover';
import type { Difficulty } from '../logic/generator';

interface Props {
  difficulty: Difficulty;
  time: string;
  mistakes: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

function IconButton({
  icon,
  onPress,
  size = 18,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  size?: number;
}) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      style={[styles.iconBtn, hovered && styles.iconBtnHovered]}
      onPress={onPress}
      {...hoverProps}
    >
      <Feather
        name={icon}
        size={size}
        color={hovered ? colors.textPrimary : colors.textSecondary}
      />
    </Pressable>
  );
}

export function Header({ difficulty, time, mistakes, isPaused, onTogglePause }: Props) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!user;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <IconButton icon="arrow-left" size={20} onPress={() => router.replace('/')} />
      </View>

      <View style={styles.center}>
        <View style={[styles.diffBadge, { borderColor: DIFFICULTY_COLORS[difficulty] }]}>
          <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[difficulty] }]}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </View>
        <View style={styles.timerRow}>
          <Text style={styles.timer}>{time}</Text>
          <IconButton icon={isPaused ? 'play' : 'pause'} size={15} onPress={onTogglePause} />
        </View>
        {mistakes > 0 && (
          <Text style={styles.mistakes}>
            {'✕'.repeat(Math.min(mistakes, 5))} mistake{mistakes !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <IconButton
          icon={isLoggedIn ? 'log-out' : 'user'}
          onPress={() => (isLoggedIn ? signOut() : router.push('/(auth)/login'))}
        />
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
  left: {
    flexDirection: 'row',
    minWidth: 80,
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
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timer: {
    fontSize: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  mistakes: {
    fontSize: 12,
    color: colors.textError,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    minWidth: 80,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconBtnHovered: {
    backgroundColor: colors.surfaceElevated,
  },
});
