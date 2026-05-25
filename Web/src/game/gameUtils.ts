import type { BoardState, SquareValue } from '../types';

export function calculateMetaWinner(bigSquares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const player of ['X', 'O'] as const) {
    const fixedSquares = bigSquares.slice();
    for (let k = 0; k < fixedSquares.length; k++) {
      if (fixedSquares[k] === '/') fixedSquares[k] = player;
    }
    for (const [a, b, c] of lines) {
      if (
        fixedSquares[a] &&
        fixedSquares[a] === fixedSquares[b] &&
        fixedSquares[a] === fixedSquares[c]
      ) {
        return fixedSquares[a];
      }
    }
  }
  return null;
}

export function isMetaDraw(bigSquares: SquareValue[]): boolean {
  if (calculateMetaWinner(bigSquares) !== null) return false;
  return bigSquares.every((c) => c !== null && c !== undefined);
}

export function isGameTerminal(board: BoardState): boolean {
  return (
    calculateMetaWinner(board.bigSquares) !== null ||
    isMetaDraw(board.bigSquares)
  );
}
