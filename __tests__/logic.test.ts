import * as B from '../src/logic/board';
import * as V from '../src/logic/validator';
import * as S from '../src/logic/solver';
import * as G from '../src/logic/generator';

// a known valid solved 6x6 board
const SOLVED_STRING = '123456456123214365365214531642642531';
const SOLVED_BOARD = B.boardFromString(SOLVED_STRING);

// same board with a few cells cleared
const PUZZLE_STRING = '100456056123010365365014031642002531';
const PUZZLE_BOARD = B.boardFromString(PUZZLE_STRING);

// board.ts
describe('createEmptyBoard', () => {
  it('returns a 6x6 grid of zeros', () => {
    const board = B.createEmptyBoard();
    expect(board).toHaveLength(B.GRID_SIZE);
    board.forEach((row) => {
      expect(row).toHaveLength(B.GRID_SIZE);
      row.forEach((v) => expect(v).toBe(B.EMPTY));
    });
  });
});

describe('cloneBoard', () => {
  it('mutations on the clone do not affect the original', () => {
    const original = B.createEmptyBoard();
    const copy = B.cloneBoard(original);
    copy[0][0] = 5;
    expect(original[0][0]).toBe(B.EMPTY);
  });
});

describe('boardFromString', () => {
  it('round trips a solved board string', () => {
    expect(B.boardToString(B.boardFromString(SOLVED_STRING))).toBe(SOLVED_STRING);
  });

  it('throws on wrong length', () => {
    expect(() => B.boardFromString('123')).toThrow();
  });

  it('throws on invalid character', () => {
    expect(() => B.boardFromString('7'.repeat(36))).toThrow();
  });
});

describe('getBox', () => {
  it('returns the correct 2x3 box for top left', () => {
    expect(B.getBox(SOLVED_BOARD, 0, 0)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns the same box for any cell inside it', () => {
    const ref = B.getBox(SOLVED_BOARD, 2, 0);
    expect(B.getBox(SOLVED_BOARD, 3, 2)).toEqual(ref);
  });
});

// validator.ts
describe('isValidPlacement', () => {
  it('allows a valid placement', () => {
    expect(V.isValidPlacement(B.createEmptyBoard(), 0, 0, 1)).toBe(true);
  });

  it('rejects a duplicate in the same row', () => {
    const board = B.cloneBoard(PUZZLE_BOARD);
    expect(V.isValidPlacement(board, 0, 1, 1)).toBe(false);
  });

  it('rejects a duplicate in the same column', () => {
    const board = B.createEmptyBoard();
    board[0][0] = 3;
    expect(V.isValidPlacement(board, 3, 0, 3)).toBe(false);
  });

  it('rejects a duplicate in the same box', () => {
    const board = B.createEmptyBoard();
    board[0][0] = 5;
    expect(V.isValidPlacement(board, 1, 2, 5)).toBe(false);
  });
});

describe('isBoardSolved', () => {
  it('returns true for a known solved board', () => {
    expect(V.isBoardSolved(SOLVED_BOARD)).toBe(true);
  });

  it('returns false for an empty board', () => {
    expect(V.isBoardSolved(B.createEmptyBoard())).toBe(false);
  });
});

// solver.ts
describe('solveSudoku', () => {
  it('solves a valid puzzle', () => {
    const result = S.solveSudoku(PUZZLE_BOARD);
    expect(result).not.toBeNull();
    expect(V.isBoardSolved(result!)).toBe(true);
  });

  it('does not mutate the input board', () => {
    const before = B.boardToString(PUZZLE_BOARD);
    S.solveSudoku(PUZZLE_BOARD);
    expect(B.boardToString(PUZZLE_BOARD)).toBe(before);
  });

  it('returns null for an unsolvable board', () => {
    const bad = B.createEmptyBoard();
    bad[0][0] = 1;
    bad[0][1] = 1;
    expect(S.solveSudoku(bad)).toBeNull();
  });
});

// generator.ts
describe('generatePuzzle', () => {
  it('solution is fully solved', () => {
    const { solution } = G.generatePuzzle('easy');
    expect(V.isBoardSolved(solution)).toBe(true);
  });

  it('puzzle has empty cells', () => {
    const { puzzle } = G.generatePuzzle('medium');
    const empties = puzzle.flat().filter((v) => v === B.EMPTY).length;
    expect(empties).toBeGreaterThan(0);
  });

  it('puzzle has a unique solution', () => {
    const { puzzle } = G.generatePuzzle('hard');
    expect(S.hasUniqueSolution(puzzle)).toBe(true);
  });
});
