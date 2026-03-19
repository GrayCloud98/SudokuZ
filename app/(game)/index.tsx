import { View, StyleSheet } from 'react-native';
import { SudokuBoard } from '@/components/SudokuBoard';
import { NumberPad } from '@/components/NumberPad';
import { useGameState } from '@/hooks/useGameState';
import { useKeyboard } from '@/hooks/useKeyboard';
import { WinScreen } from '@/components/WinScreen';

export default function GameScreen() {
  const { gameBoard, selectedCell, isSolved, selectCell, placeNumber, erase, newGame } =
    useGameState('easy');

  useKeyboard({
    selectedCell,
    onSelectCell: selectCell,
    onPlaceNumber: placeNumber,
    onErase: erase,
  });

  return (
    <View style={styles.container}>
      <SudokuBoard gameBoard={gameBoard} selectedCell={selectedCell} onCellPress={selectCell} />
      <NumberPad onNumberPress={(num) => placeNumber(num)} onErase={erase} />
      {isSolved && <WinScreen onNewGame={newGame} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
