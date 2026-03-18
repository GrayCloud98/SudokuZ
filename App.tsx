import { View } from 'react-native';
import { supabase } from './lib/supabase';
import { SudokuBoard } from './src/components/SudokuBoard';
import { NumberPad } from './src/components/NumberPad';
import { useGameState } from './src/hooks/useGameState';
import { useKeyboard } from './src/hooks/useKeyboard';
import { WinScreen } from './src/components/WinScreen';

supabase.auth.getSession().then(({ data, error }) => {
  if (error) console.log('Supabase error:', error);
  else console.log('Supabase connected:', data);
});

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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <SudokuBoard gameBoard={gameBoard} selectedCell={selectedCell} onCellPress={selectCell} />
      <NumberPad onNumberPress={(num) => placeNumber(num)} onErase={erase} />
      {isSolved && <WinScreen onNewGame={newGame} />}
    </View>
  );
}
