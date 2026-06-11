import { useReducer } from 'react';
import * as B from '../logic/board';
import * as V from '../logic/validator';
import * as G from '../logic/generator';

const UNDO_LIMIT = 30;
export const HINT_LIMIT = 3;

interface GameState {
  gameBoard: B.GameBoard;
  puzzle: B.Board;
  solution: B.Board;
  selectedCell: [number, number] | null;
  isSolved: boolean;
  difficulty: G.Difficulty;
  notesMode: boolean;
  mistakes: number;
  hintsRemaining: number;
  history: B.GameBoard[];
}

type Action =
  | { type: 'selectCell'; row: number; col: number }
  | { type: 'placeNumber'; value: B.CellValue }
  | { type: 'erase' }
  | { type: 'toggleNotesMode' }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'newGame'; difficulty: G.Difficulty }
  | {
      type: 'loadGame';
      puzzle: B.Board;
      solution: B.Board;
      board: B.Board;
      difficulty: G.Difficulty;
    };

function cloneMeta(meta: B.CellMeta[][]): B.CellMeta[][] {
  return meta.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
}

function cloneBoard(gb: B.GameBoard): B.GameBoard {
  return { values: B.cloneBoard(gb.values), meta: cloneMeta(gb.meta) };
}

function buildInitialState(difficulty: G.Difficulty): GameState {
  const { puzzle, solution } = G.generatePuzzle(difficulty);
  return {
    gameBoard: B.createGameBoard(puzzle),
    puzzle,
    solution,
    selectedCell: null,
    isSolved: false,
    difficulty,
    notesMode: false,
    mistakes: 0,
    hintsRemaining: HINT_LIMIT,
    history: [],
  };
}

function applyErrors(values: B.Board, meta: B.CellMeta[][]): B.CellMeta[][] {
  const errors = V.computeErrors(values);
  return meta.map((r, ri) => r.map((cell, ci) => ({ ...cell, isError: errors[ri][ci] })));
}

function pushHistory(history: B.GameBoard[], current: B.GameBoard): B.GameBoard[] {
  const next = [...history, cloneBoard(current)];
  return next.length > UNDO_LIMIT ? next.slice(next.length - UNDO_LIMIT) : next;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'selectCell':
      return { ...state, selectedCell: [action.row, action.col] };

    case 'toggleNotesMode':
      return { ...state, notesMode: !state.notesMode };

    case 'placeNumber': {
      if (state.isSolved || !state.selectedCell) return state;
      const [row, col] = state.selectedCell;
      if (state.gameBoard.meta[row][col].isGiven) return state;

      const newMeta = cloneMeta(state.gameBoard.meta);

      if (state.notesMode) {
        // Toggle note only on empty cells
        if (state.gameBoard.values[row][col] !== B.EMPTY) return state;
        const notes = newMeta[row][col].notes;
        if (notes.has(action.value)) {
          notes.delete(action.value);
        } else {
          notes.add(action.value);
        }
        return {
          ...state,
          history: pushHistory(state.history, state.gameBoard),
          gameBoard: { values: state.gameBoard.values, meta: newMeta },
        };
      }

      const newValues = B.cloneBoard(state.gameBoard.values);
      newValues[row][col] = action.value;
      // Clear notes in same row, col, box for the placed value
      for (let r = 0; r < B.GRID_SIZE; r++) {
        for (let c = 0; c < B.GRID_SIZE; c++) {
          if (
            r === row ||
            c === col ||
            (Math.floor(r / B.BOX_ROWS) === Math.floor(row / B.BOX_ROWS) &&
              Math.floor(c / B.BOX_COLS) === Math.floor(col / B.BOX_COLS))
          ) {
            newMeta[r][c].notes.delete(action.value);
          }
        }
      }
      // Clear this cell's notes when placing a number
      newMeta[row][col].notes.clear();

      const updatedMeta = applyErrors(newValues, newMeta);
      const isSolved = V.isBoardSolved(newValues);

      const isWrongPlacement =
        action.value !== B.EMPTY && action.value !== state.solution[row][col];
      const mistakes = state.mistakes + (isWrongPlacement ? 1 : 0);

      return {
        ...state,
        history: pushHistory(state.history, state.gameBoard),
        gameBoard: { values: newValues, meta: updatedMeta },
        isSolved,
        mistakes,
      };
    }

    case 'erase': {
      if (state.isSolved || !state.selectedCell) return state;
      const [row, col] = state.selectedCell;
      if (state.gameBoard.meta[row][col].isGiven) return state;

      const newValues = B.cloneBoard(state.gameBoard.values);
      const newMeta = cloneMeta(state.gameBoard.meta);

      if (newMeta[row][col].notes.size > 0) {
        newMeta[row][col].notes.clear();
        return {
          ...state,
          history: pushHistory(state.history, state.gameBoard),
          gameBoard: { values: newValues, meta: newMeta },
        };
      }

      newValues[row][col] = B.EMPTY;
      const updatedMeta = applyErrors(newValues, newMeta);
      return {
        ...state,
        history: pushHistory(state.history, state.gameBoard),
        gameBoard: { values: newValues, meta: updatedMeta },
      };
    }

    case 'undo': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        history: state.history.slice(0, -1),
        gameBoard: cloneBoard(prev),
        isSolved: false,
      };
    }

    case 'hint': {
      if (state.isSolved || state.hintsRemaining <= 0) return state;
      // Find an empty non-given cell that we can reveal
      const candidates: [number, number][] = [];
      for (let r = 0; r < B.GRID_SIZE; r++) {
        for (let c = 0; c < B.GRID_SIZE; c++) {
          if (!state.gameBoard.meta[r][c].isGiven && state.gameBoard.values[r][c] === B.EMPTY) {
            candidates.push([r, c]);
          }
        }
      }
      if (candidates.length === 0) return state;

      // Prefer selected cell if it's a valid candidate
      let [row, col] = candidates[Math.floor(Math.random() * candidates.length)];
      if (state.selectedCell) {
        const [sr, sc] = state.selectedCell;
        if (!state.gameBoard.meta[sr][sc].isGiven && state.gameBoard.values[sr][sc] === B.EMPTY) {
          [row, col] = [sr, sc];
        }
      }

      const newValues = B.cloneBoard(state.gameBoard.values);
      newValues[row][col] = state.solution[row][col];
      const newMeta = cloneMeta(state.gameBoard.meta);
      newMeta[row][col].notes.clear();
      const updatedMeta = applyErrors(newValues, newMeta);
      const isSolved = V.isBoardSolved(newValues);

      return {
        ...state,
        history: pushHistory(state.history, state.gameBoard),
        gameBoard: { values: newValues, meta: updatedMeta },
        isSolved,
        hintsRemaining: state.hintsRemaining - 1,
        selectedCell: [row, col],
      };
    }

    case 'newGame':
      return buildInitialState(action.difficulty);

    case 'loadGame':
      return {
        ...buildInitialState(action.difficulty),
        gameBoard: B.createGameBoard(action.puzzle, action.board),
        puzzle: action.puzzle,
        solution: action.solution,
        difficulty: action.difficulty,
      };

    default:
      return state;
  }
}

export function useGameState(initialDifficulty: G.Difficulty = 'medium') {
  const [state, dispatch] = useReducer(reducer, initialDifficulty, buildInitialState);

  return {
    gameBoard: state.gameBoard,
    puzzle: state.puzzle,
    solution: state.solution,
    selectedCell: state.selectedCell,
    isSolved: state.isSolved,
    difficulty: state.difficulty,
    notesMode: state.notesMode,
    mistakes: state.mistakes,
    hintsRemaining: state.hintsRemaining,
    canUndo: state.history.length > 0,
    selectCell: (row: number, col: number) => dispatch({ type: 'selectCell', row, col }),
    placeNumber: (value: B.CellValue) => dispatch({ type: 'placeNumber', value }),
    erase: () => dispatch({ type: 'erase' }),
    toggleNotesMode: () => dispatch({ type: 'toggleNotesMode' }),
    undo: () => dispatch({ type: 'undo' }),
    hint: () => dispatch({ type: 'hint' }),
    newGame: (difficulty: G.Difficulty) => dispatch({ type: 'newGame', difficulty }),
    loadGame: (puzzle: B.Board, solution: B.Board, board: B.Board, difficulty: G.Difficulty) =>
      dispatch({ type: 'loadGame', puzzle, solution, board, difficulty }),
  };
}
