import * as B from './board';
import * as V from './validator';
import * as S from './solver';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Number of filled cells to leave on the board per difficulty (out of 36 total)
const GIVENS: Record<Difficulty, number> = {
  easy: 24,
  medium: 18,
  hard: 14,
};

export interface GeneratedPuzzle {
  puzzle: B.Board;
  solution: B.Board;
  difficulty: Difficulty;
}

// Main entry point, generates a random uniquely solvable puzzle
export function generatePuzzle(difficulty: Difficulty = 'medium'): GeneratedPuzzle {
  const solution = generateFullBoard();
  const puzzle = digHoles(B.cloneBoard(solution), GIVENS[difficulty]);
  return { puzzle, solution, difficulty };
}

// Fills an empty board with a valid solution using shuffled digits for variety
function generateFullBoard(): B.Board {
  const board = B.createEmptyBoard();
  fillBoard(board);
  return board;
}

// Recursive fill, tries digits in random order so each puzzle is different
function fillBoard(board: B.Board): boolean {
  for (let r = 0; r < B.GRID_SIZE; r++) {
    for (let c = 0; c < B.GRID_SIZE; c++) {
      if (board[r][c] !== B.EMPTY) continue;

      const digits = shuffle([1, 2, 3, 4, 5, 6] as B.CellValue[]);
      for (const val of digits) {
        if (V.isValidPlacement(board, r, c, val)) {
          board[r][c] = val;
          if (fillBoard(board)) return true;
          board[r][c] = B.EMPTY;
        }
      }
      return false;
    }
  }
  return true;
}

// Removes cells one by one until we hit the target givens count
// skips a cell if removing it would break unique solvability
function digHoles(board: B.Board, targetGivens: number): B.Board {
  const positions: [number, number][] = [];
  for (let r = 0; r < B.GRID_SIZE; r++) {
    for (let c = 0; c < B.GRID_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let givens = B.GRID_SIZE * B.GRID_SIZE;

  for (const [r, c] of positions) {
    if (givens <= targetGivens) break;

    const backup = board[r][c];
    board[r][c] = B.EMPTY;

    if (S.hasUniqueSolution(board)) {
      givens--;
    } else {
      board[r][c] = backup; // removing this cell breaks uniqueness so we put it back
    }
  }

  return board;
}

// Fisher-Yates shuffle, mutates and returns the same array
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
