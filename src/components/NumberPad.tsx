import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as B from '../logic/board';
import { colors, fonts, spacing, radius } from '../theme/theme';
import { useHover } from '../hooks/useHover';

interface Props {
  onNumberPress: (num: B.CellValue) => void;
  gameBoard: B.GameBoard;
  notesMode?: boolean;
}

function countRemaining(gameBoard: B.GameBoard, num: number): number {
  let placed = 0;
  for (const row of gameBoard.values) {
    for (const cell of row) {
      if (cell === num) placed++;
    }
  }
  return B.GRID_SIZE - placed;
}

function NumberButton({
  num,
  remaining,
  notesMode,
  onPress,
}: {
  num: number;
  remaining: number;
  notesMode: boolean;
  onPress: () => void;
}) {
  const { hovered, hoverProps } = useHover();
  const disabled = remaining === 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        hovered && !disabled && styles.buttonHovered,
        notesMode && !disabled && styles.buttonNotes,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      {...hoverProps}
    >
      <Text
        style={[
          styles.numText,
          notesMode && !disabled && styles.numTextNotes,
          disabled && styles.numTextDisabled,
        ]}
      >
        {num}
      </Text>
      <Text style={[styles.countText, disabled && styles.countTextDisabled]}>{remaining}</Text>
    </Pressable>
  );
}

export function NumberPad({ onNumberPress, gameBoard, notesMode = false }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((num) => (
        <NumberButton
          key={num}
          num={num}
          remaining={countRemaining(gameBoard, num)}
          notesMode={notesMode}
          onPress={() => onNumberPress(num as B.CellValue)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  button: {
    flex: 1,
    height: 64,
    backgroundColor: colors.numBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.numBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonHovered: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.surfaceElevated,
  },
  buttonNotes: {
    borderStyle: 'dashed',
    borderColor: colors.accentBorder,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: colors.controlActive,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  numText: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.numText,
    lineHeight: 30,
  },
  numTextNotes: {
    color: colors.textUser,
  },
  numTextDisabled: {
    color: colors.numDisabled,
  },
  countText: {
    fontSize: 11,
    color: colors.numCount,
    fontFamily: fonts.medium,
    fontWeight: '500',
    lineHeight: 13,
  },
  countTextDisabled: {
    color: colors.numDisabled,
  },
});
