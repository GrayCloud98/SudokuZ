import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as B from '../logic/board';
import { SudokuCell } from './SudokuCell';

interface Props {
  gameBoard: B.GameBoard;
  selectedCell: [number, number] | null;
  onCellPress: (row: number, col: number) => void;
}

export function SudokuBoard({ gameBoard, selectedCell, onCellPress }: Props) {
  return (
    <View style={styles.board}>
      {gameBoard.values.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => (
            <SudokuCell
              key={c}
              value={value}
              isSelected={selectedCell?.[0] === r && selectedCell?.[1] === c}
              isGiven={gameBoard.meta[r][c].isGiven}
              isError={gameBoard.meta[r][c].isError}
              onPress={() => onCellPress(r, c)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 2,
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
  },
});
