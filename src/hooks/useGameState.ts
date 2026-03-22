import { useReducer } from 'react';
import * as B from '../logic/board';
import * as V from '../logic/validator';
import * as G from '../logic/generator';

interface GameState {
  gameBoard: B.GameBoard;
  puzzle: B.Board;
  solution: B.Board;
  selectedCell: [number, number] | null;
  isSolved: boolean;
  difficulty: G.Difficulty;
}

type Action =
  | { type: 'selectCell'; row: number; col: number }
  | { type: 'placeNumber'; value: B.CellValue }
  | { type: 'erase' }
  | { type: 'newGame'; difficulty: G.Difficulty }
  | {
      type: 'loadGame';
      puzzle: B.Board;
      solution: B.Board;
      board: B.Board;
      difficulty: G.Difficulty;
    };

function buildInitialState(difficulty: G.Difficulty): GameState {
  const { puzzle, solution } = G.generatePuzzle(difficulty);
  return {
    gameBoard: B.createGameBoard(puzzle),
    puzzle,
    solution,
    selectedCell: null,
    isSolved: false,
    difficulty,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'selectCell': {
      return { ...state, selectedCell: [action.row, action.col] };
    }

    case 'placeNumber': {
      if (!state.selectedCell) return state;
      const [row, col] = state.selectedCell;

      // dont allow editing given cells
      if (state.gameBoard.meta[row][col].isGiven) return state;

      const newValues = B.cloneBoard(state.gameBoard.values);
      newValues[row][col] = action.value;

      const errors = V.computeErrors(newValues);
      const newMeta = state.gameBoard.meta.map((r, ri) =>
        r.map((cell, ci) => ({ ...cell, isError: errors[ri][ci] }))
      );

      const newGameBoard = { values: newValues, meta: newMeta };
      const isSolved = V.isBoardSolved(newValues);

      return { ...state, gameBoard: newGameBoard, isSolved };
    }

    case 'erase': {
      if (!state.selectedCell) return state;
      const [row, col] = state.selectedCell;

      // dont allow erasing given cells
      if (state.gameBoard.meta[row][col].isGiven) return state;

      const newValues = B.cloneBoard(state.gameBoard.values);
      newValues[row][col] = B.EMPTY;

      const errors = V.computeErrors(newValues);
      const newMeta = state.gameBoard.meta.map((r, ri) =>
        r.map((cell, ci) => ({ ...cell, isError: errors[ri][ci] }))
      );

      return { ...state, gameBoard: { values: newValues, meta: newMeta } };
    }

    case 'newGame': {
      return buildInitialState(action.difficulty);
    }

    case 'loadGame': {
      return {
        ...buildInitialState(action.difficulty),
        gameBoard: B.createGameBoard(action.puzzle, action.board),
        puzzle: action.puzzle,
        solution: action.solution,
        difficulty: action.difficulty,
      };
    }
    default:
      return state;
  }
}

export function useGameState(difficulty: G.Difficulty = 'medium') {
  const [state, dispatch] = useReducer(reducer, difficulty, buildInitialState);

  return {
    gameBoard: state.gameBoard,
    puzzle: state.puzzle,
    solution: state.solution,
    selectedCell: state.selectedCell,
    isSolved: state.isSolved,
    difficulty: state.difficulty,
    selectCell: (row: number, col: number) => dispatch({ type: 'selectCell', row, col }),
    placeNumber: (value: B.CellValue) => dispatch({ type: 'placeNumber', value }),
    erase: () => dispatch({ type: 'erase' }),
    newGame: (difficulty: G.Difficulty) => dispatch({ type: 'newGame', difficulty }),
    loadGame: (puzzle: B.Board, solution: B.Board, board: B.Board, difficulty: G.Difficulty) =>
      dispatch({ type: 'loadGame', puzzle, solution, board, difficulty }),
  };
}
