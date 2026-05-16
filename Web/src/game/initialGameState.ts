import type { BoardState } from '../types';

export function createInitialGameHistory(): BoardState[] {
  return [
    {
      squares: Array.from(Array(9), () => new Array(9).fill(null)),
      bigSquares: Array(9).fill(null),
      availableBoard: 4,
      xIsNext: true,
    },
  ];
}
