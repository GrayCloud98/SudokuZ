import { View } from 'react-native';
import { SudokuBoard } from '@/components/SudokuBoard';
import { NumberPad } from '@/components/NumberPad';
import { useGameState } from '@/hooks/useGameState';
import { useKeyboard } from '@/hooks/useKeyboard';
import { WinScreen } from '@/components/WinScreen';
import { AuthProvider } from '@/context/AuthContext';

export default function App() {
  const { gameBoard, selectedCell, isSolved, selectCell, placeNumber, erase, newGame } =
    useGameState('easy');

  useKeyboard({
    selectedCell,
    onSelectCell: selectCell,
    onPlaceNumber: placeNumber,
    onErase: erase,
  });

  return (
    <AuthProvider>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <SudokuBoard gameBoard={gameBoard} selectedCell={selectedCell} onCellPress={selectCell} />
        <NumberPad onNumberPress={(num) => placeNumber(num)} onErase={erase} />
        {isSolved && <WinScreen onNewGame={newGame} />}
      </View>
    </AuthProvider>
  );
}
