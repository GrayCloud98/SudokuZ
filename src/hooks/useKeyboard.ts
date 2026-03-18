import { useEffect } from 'react';
import * as B from '../logic/board';

interface Props {
  selectedCell: [number, number] | null;
  onSelectCell: (row: number, col: number) => void;
  onPlaceNumber: (value: B.CellValue) => void;
  onErase: () => void;
}

export function useKeyboard({ selectedCell, onSelectCell, onPlaceNumber, onErase }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // number keys 1-6 place a number
      if (e.key >= '1' && e.key <= '6') {
        onPlaceNumber(parseInt(e.key) as B.CellValue);
        return;
      }

      // delete or backspace erases the cell
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onErase();
        return;
      }

      // arrow keys move the selection around the board
      if (!selectedCell) return;
      const [row, col] = selectedCell;

      switch (e.key) {
        case 'ArrowUp':
          return onSelectCell(Math.max(0, row - 1), col);
        case 'ArrowDown':
          return onSelectCell(Math.min(5, row + 1), col);
        case 'ArrowLeft':
          return onSelectCell(row, Math.max(0, col - 1));
        case 'ArrowRight':
          return onSelectCell(row, Math.min(5, col + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, onSelectCell, onPlaceNumber, onErase]);
}
