export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Board = CellValue[][];

export const GRID_SIZE = 6;
export const BOX_ROWS = 2;
export const BOX_COLS = 3;
export const EMPTY: CellValue = 0;

// Creates a fresh 6x6 grid filled with zeros
export function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => EMPTY));
}

// Returns a new board with the same values (useful for immutability)
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row] as CellValue[]);
}

// Parses a 36-char string into a Board ("." or "0" = empty)
export function boardFromString(s: string): Board {
  const clean = s.replace(/\./g, '0');
  if (clean.length !== GRID_SIZE * GRID_SIZE) {
    throw new Error(`expected 36 chars, got ${clean.length}`);
  }
  const board = createEmptyBoard();
  for (let i = 0; i < clean.length; i++) {
    const v = parseInt(clean[i], 10);
    if (isNaN(v) || v < 0 || v > GRID_SIZE) {
      throw new Error(`invalid char '${clean[i]}' at index ${i}`);
    }
    board[Math.floor(i / GRID_SIZE)][i % GRID_SIZE] = v as CellValue;
  }
  return board;
}

// Serializes a board back to a 36-char string
export function boardToString(board: Board): string {
  return board.flat().join('');
}

// Returns a copy of the specified row
export function getRow(board: Board, row: number): CellValue[] {
  return [...board[row]];
}

// Returns a copy of the specified column
export function getCol(board: Board, col: number): CellValue[] {
  return board.map((row) => row[col]);
}

// Returns the 6 cells of the 2x3 box containing (row, col)
export function getBox(board: Board, row: number, col: number): CellValue[] {
  const startRow = Math.floor(row / BOX_ROWS) * BOX_ROWS;
  const startCol = Math.floor(col / BOX_COLS) * BOX_COLS;
  const cells: CellValue[] = [];
  for (let r = startRow; r < startRow + BOX_ROWS; r++) {
    for (let c = startCol; c < startCol + BOX_COLS; c++) {
      cells.push(board[r][c]);
    }
  }
  return cells;
}
