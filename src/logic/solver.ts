import * as B from './board';
import * as V from './validator';

// Public facing solver, clones the board so we never touch the original
export function solveSudoku(board: B.Board): B.Board | null {
  const work = B.cloneBoard(board);
  return solve(work) ? work : null;
}

// Scans left to right, top to bottom and returns the first empty cell
function findNextEmpty(board: B.Board): [number, number] | null {
  for (let r = 0; r < B.GRID_SIZE; r++) {
    for (let c = 0; c < B.GRID_SIZE; c++) {
      if (board[r][c] === B.EMPTY) return [r, c];
    }
  }
  return null;
}

// The actual recursive solver, mutates the board in place
// tries digits 1-6, backtracks if none of them work
function solve(board: B.Board): boolean {
  const cell = findNextEmpty(board);
  if (!cell) return true;

  const [row, col] = cell;

  for (let num = 1; num <= B.GRID_SIZE; num++) {
    const val = num as B.CellValue;
    if (V.isValidPlacement(board, row, col, val)) {
      board[row][col] = val;
      if (solve(board)) return true;
      board[row][col] = B.EMPTY; // val didn't lead to a solution, reset and try next number
    }
  }

  return false;
}

// Checks if the puzzle has exactly one solution by counting up to 2
export function hasUniqueSolution(board: B.Board): boolean {
  const work = B.cloneBoard(board);
  return countSolutions(work, 0) === 1;
}

// Recursive solution counter, bails out early once it finds more than 1
function countSolutions(board: B.Board, count: number): number {
  if (count > 1) return count;
  const cell = findNextEmpty(board);
  if (!cell) return count + 1;

  const [row, col] = cell;
  for (let num = 1; num <= B.GRID_SIZE; num++) {
    const val = num as B.CellValue;
    if (V.isValidPlacement(board, row, col, val)) {
      board[row][col] = val;
      count = countSolutions(board, count);
      board[row][col] = B.EMPTY;
    }
  }

  return count;
}
