import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as B from '../logic/board';
import { colors, spacing, radius } from '../theme/theme';

interface Props {
  onNumberPress: (num: B.CellValue) => void;
  gameBoard: B.GameBoard;
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

export function NumberPad({ onNumberPress, gameBoard }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((num) => {
        const remaining = countRemaining(gameBoard, num);
        const disabled = remaining === 0;
        return (
          <TouchableOpacity
            key={num}
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => !disabled && onNumberPress(num as B.CellValue)}
            activeOpacity={disabled ? 1 : 0.65}
          >
            <Text style={[styles.numText, disabled && styles.numTextDisabled]}>{num}</Text>
            <Text style={[styles.countText, disabled && styles.countTextDisabled]}>
              {remaining}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  buttonDisabled: {
    opacity: 0.3,
  },
  numText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.numText,
    lineHeight: 30,
  },
  numTextDisabled: {
    color: colors.numDisabled,
  },
  countText: {
    fontSize: 11,
    color: colors.numCount,
    fontWeight: '500',
    lineHeight: 13,
  },
  countTextDisabled: {
    color: colors.numDisabled,
  },
});
