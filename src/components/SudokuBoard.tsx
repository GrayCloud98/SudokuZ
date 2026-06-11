import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as B from '../logic/board';
import { SudokuCell } from './SudokuCell';
import { colors } from '../theme/theme';

interface Props {
  gameBoard: B.GameBoard;
  selectedCell: [number, number] | null;
  cellSize: number;
  onCellPress: (row: number, col: number) => void;
}

function isInSameBox(r: number, c: number, sr: number, sc: number): boolean {
  return (
    Math.floor(r / B.BOX_ROWS) === Math.floor(sr / B.BOX_ROWS) &&
    Math.floor(c / B.BOX_COLS) === Math.floor(sc / B.BOX_COLS)
  );
}

export function SudokuBoard({ gameBoard, selectedCell, cellSize, onCellPress }: Props) {
  const selectedValue =
    selectedCell != null ? gameBoard.values[selectedCell[0]][selectedCell[1]] : B.EMPTY;

  return (
    <View style={styles.board}>
      {gameBoard.values.map((row, r) => (
        <View
          key={r}
          style={[
            styles.row,
            (r + 1) % B.BOX_ROWS === 0 && r !== B.GRID_SIZE - 1 && styles.rowBoxBorder,
          ]}
        >
          {row.map((value, c) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const [sr, sc] = selectedCell ?? [-1, -1];
            const isHighlighted =
              !isSelected &&
              selectedCell != null &&
              (r === sr || c === sc || isInSameBox(r, c, sr, sc));
            const isSameNumber =
              !isSelected && !isHighlighted && selectedValue !== B.EMPTY && value === selectedValue;

            return (
              <SudokuCell
                key={c}
                value={value}
                size={cellSize}
                notes={gameBoard.meta[r][c].notes}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isSameNumber={isSameNumber}
                isGiven={gameBoard.meta[r][c].isGiven}
                isError={gameBoard.meta[r][c].isError}
                isLastInBox={c === B.BOX_COLS - 1 && c !== B.GRID_SIZE - 1}
                onPress={() => onCellPress(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 2,
    borderColor: colors.borderOuter,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.06)',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBoxBorder: {
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBox,
  },
});
