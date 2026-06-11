import React, { useEffect, useRef } from 'react';
import { Text, Pressable, StyleSheet, View, Animated } from 'react-native';
import * as B from '../logic/board';
import { colors, fonts, USE_NATIVE_DRIVER } from '../theme/theme';
import { useHover } from '../hooks/useHover';

const NOTE_ROWS = 2;
const NOTE_COLS = 3;
// Notes grid: [1,2,3] top row, [4,5,6] bottom row
const NOTE_POSITIONS: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 1],
  [1, 2],
];

interface Props {
  value: B.CellValue;
  notes: Set<number>;
  size: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isError: boolean;
  isGiven: boolean;
  isLastInBox: boolean;
  onPress: () => void;
}

export function SudokuCell({
  value,
  notes,
  size,
  isSelected,
  isHighlighted,
  isSameNumber,
  isError,
  isGiven,
  isLastInBox,
  onPress,
}: Props) {
  const { hovered, hoverProps } = useHover();
  const pop = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  // Pop animation when a number lands in this cell (not on erase / initial givens)
  useEffect(() => {
    if (value !== B.EMPTY && value !== prevValue.current && !isGiven) {
      pop.setValue(1.35);
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
    prevValue.current = value;
  }, [value, isGiven, pop]);

  let bg: string = colors.cellDefault;
  if (isSelected && isError) bg = colors.cellErrorSelected;
  else if (isSelected) bg = colors.cellSelected;
  else if (isError) bg = colors.cellError;
  else if (isSameNumber) bg = colors.cellSameNumber;
  else if (isHighlighted) bg = colors.cellHighlight;

  const showNotes = value === B.EMPTY && notes.size > 0;
  const noteBox = size - 4;
  const valueSize = Math.round(size * 0.45);
  const noteSize = Math.max(8, Math.round(size * 0.19));

  return (
    <Pressable
      style={[
        styles.cell,
        { width: size, height: size, backgroundColor: bg },
        isLastInBox && styles.cellBoxBorder,
      ]}
      onPress={onPress}
      {...hoverProps}
    >
      {hovered && !isSelected && <View style={styles.hoverOverlay} pointerEvents="none" />}
      {showNotes ? (
        <View style={[styles.notesGrid, { width: noteBox, height: noteBox }]} pointerEvents="none">
          {NOTE_POSITIONS.map((_, idx) => {
            const num = idx + 1;
            const present = notes.has(num);
            return (
              <View
                key={num}
                style={[
                  styles.noteCell,
                  { width: noteBox / NOTE_COLS, height: noteBox / NOTE_ROWS },
                ]}
              >
                <Text
                  style={[
                    styles.noteText,
                    { fontSize: noteSize },
                    isSelected && styles.noteTextSelected,
                    !present && styles.noteTextHidden,
                  ]}
                >
                  {present ? num : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Animated.Text
          style={[
            styles.value,
            { fontSize: valueSize, transform: [{ scale: pop }] },
            isGiven ? styles.given : styles.userInput,
            isSelected && styles.selectedText,
            isError && !isSelected && styles.errorText,
          ]}
        >
          {value === B.EMPTY ? '' : value}
        </Animated.Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBoxBorder: {
    borderRightWidth: 2,
    borderRightColor: colors.borderBox,
  },
  hoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(148,163,184,0.10)',
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  given: {
    color: colors.textGiven,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  userInput: {
    color: colors.textUser,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.textSelected,
  },
  errorText: {
    color: colors.textError,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    color: colors.textNote,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  noteTextSelected: {
    color: colors.textNoteSelected,
  },
  noteTextHidden: {
    opacity: 0,
  },
});
