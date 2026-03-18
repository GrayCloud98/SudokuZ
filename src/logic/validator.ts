import * as B from './board';

// Returns true if placing value at (row, col) doesn't conflict with any row, col, or box
export function isValidPlacement(
  board: B.Board,
  row: number,
  col: number,
  value: B.CellValue
): boolean {
  if (value === B.EMPTY) return true;

  const rowVals = B.getRow(board, row);
  for (let c = 0; c < B.GRID_SIZE; c++) {
    if (c !== col && rowVals[c] === value) return false;
  }

  const colVals = B.getCol(board, col);
  for (let r = 0; r < B.GRID_SIZE; r++) {
    if (r !== row && colVals[r] === value) return false;
  }

  const startRow = Math.floor(row / 2) * 2;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 2; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) return false;
    }
  }

  return true;
}

// Returns true if the board is completely and correctly filled
export function isBoardSolved(board: B.Board): boolean {
  const regionComplete = (cells: B.CellValue[]): boolean => {
    const seen = new Set(cells);
    return seen.size === B.GRID_SIZE && !seen.has(B.EMPTY);
  };

  for (let i = 0; i < B.GRID_SIZE; i++) {
    if (!regionComplete(B.getRow(board, i))) return false;
    if (!regionComplete(B.getCol(board, i))) return false;
  }

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 2; bc++) {
      if (!regionComplete(B.getBox(board, br * 2, bc * 3))) return false;
    }
  }

  return true;
}

// Returns a 2D boolean grid marking which cells have conflicts
export function computeErrors(board: B.Board): boolean[][] {
  return board.map((row, r) =>
    row.map((val, c) => val !== B.EMPTY && !isValidPlacement(board, r, c, val))
  );
}
