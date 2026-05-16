import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import * as B from '../logic/board';
import { colors } from '../theme/theme';

const CELL_SIZE = 56;
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
  isSelected,
  isHighlighted,
  isSameNumber,
  isError,
  isGiven,
  isLastInBox,
  onPress,
}: Props) {
  let bg: string = colors.cellDefault;
  if (isSelected && isError) bg = colors.cellErrorSelected;
  else if (isSelected) bg = colors.cellSelected;
  else if (isError) bg = colors.cellError;
  else if (isSameNumber) bg = colors.cellSameNumber;
  else if (isHighlighted) bg = colors.cellHighlight;

  const showNotes = value === B.EMPTY && notes.size > 0;

  return (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: bg }, isLastInBox && styles.cellBoxBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showNotes ? (
        <View style={styles.notesGrid}>
          {NOTE_POSITIONS.map((_, idx) => {
            const num = idx + 1;
            const present = notes.has(num);
            return (
              <View key={num} style={styles.noteCell}>
                <Text
                  style={[
                    styles.noteText,
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
        <Text
          style={[
            styles.value,
            isGiven ? styles.given : styles.userInput,
            isSelected && styles.selectedText,
            isError && !isSelected && styles.errorText,
          ]}
        >
          {value === B.EMPTY ? '' : value}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBoxBorder: {
    borderRightWidth: 2,
    borderRightColor: colors.borderBox,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
  },
  given: {
    color: colors.textGiven,
    fontWeight: '700',
  },
  userInput: {
    color: colors.textUser,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.textSelected,
  },
  errorText: {
    color: colors.textError,
  },
  notesGrid: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteCell: {
    width: (CELL_SIZE - 4) / NOTE_COLS,
    height: (CELL_SIZE - 4) / NOTE_ROWS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 10,
    color: colors.textNote,
    fontWeight: '500',
  },
  noteTextSelected: {
    color: colors.textNoteSelected,
  },
  noteTextHidden: {
    opacity: 0,
  },
});
