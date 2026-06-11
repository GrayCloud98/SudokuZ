import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '../theme/theme';
import { useHover } from '../hooks/useHover';

interface Props {
  notesMode: boolean;
  canUndo: boolean;
  hintsRemaining: number;
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
}

interface ControlBtn {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
}

function ControlButton({ btn }: { btn: ControlBtn }) {
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      style={[
        styles.btn,
        hovered && !btn.disabled && styles.btnHovered,
        btn.active && styles.btnActive,
        btn.disabled && styles.btnDisabled,
      ]}
      onPress={btn.disabled ? undefined : btn.onPress}
      {...hoverProps}
    >
      <View>
        <Feather
          name={btn.icon}
          size={22}
          color={
            btn.disabled ? colors.textMuted : btn.active ? colors.accent : colors.textSecondary
          }
        />
        {btn.badge !== undefined && !btn.disabled && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{btn.badge}</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.label,
          btn.active && styles.labelActive,
          btn.disabled && styles.labelDisabled,
        ]}
      >
        {btn.label}
      </Text>
    </Pressable>
  );
}

export function GameControls({
  notesMode,
  canUndo,
  hintsRemaining,
  onUndo,
  onErase,
  onToggleNotes,
  onHint,
}: Props) {
  const buttons: ControlBtn[] = [
    { icon: 'rotate-ccw', label: 'Undo', onPress: onUndo, disabled: !canUndo },
    { icon: 'delete', label: 'Erase', onPress: onErase },
    { icon: 'edit-3', label: 'Notes', onPress: onToggleNotes, active: notesMode },
    {
      icon: 'zap',
      label: 'Hint',
      onPress: onHint,
      disabled: hintsRemaining === 0,
      badge: hintsRemaining,
    },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <ControlButton key={btn.label} btn={btn} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
  },
  btn: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  btnHovered: {
    backgroundColor: 'rgba(148,163,184,0.08)',
  },
  btnActive: {
    backgroundColor: colors.controlActive,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.accent,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});
