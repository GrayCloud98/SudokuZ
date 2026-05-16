import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';

interface Props {
  notesMode: boolean;
  canUndo: boolean;
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
}

export function GameControls({
  notesMode,
  canUndo,
  onUndo,
  onErase,
  onToggleNotes,
  onHint,
}: Props) {
  const buttons: ControlBtn[] = [
    { icon: 'rotate-ccw', label: 'Undo', onPress: onUndo, disabled: !canUndo },
    { icon: 'delete', label: 'Erase', onPress: onErase },
    { icon: 'edit-3', label: 'Notes', onPress: onToggleNotes, active: notesMode },
    { icon: 'zap', label: 'Hint', onPress: onHint },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.label}
          style={[styles.btn, btn.active && styles.btnActive, btn.disabled && styles.btnDisabled]}
          onPress={btn.onPress}
          activeOpacity={btn.disabled ? 1 : 0.7}
        >
          <Feather
            name={btn.icon}
            size={22}
            color={
              btn.disabled ? colors.textMuted : btn.active ? colors.accent : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.label,
              btn.active && styles.labelActive,
              btn.disabled && styles.labelDisabled,
            ]}
          >
            {btn.label}
          </Text>
        </TouchableOpacity>
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
  btnActive: {
    backgroundColor: colors.controlActive,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 11,
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
