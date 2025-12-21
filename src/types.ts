// Type definitions for the Ultimate Tic Tac Toe game

export type SquareValue = 'X' | 'O' | null | '/';

export interface BoardState {
  squares: SquareValue[][];
  bigSquares: SquareValue[];
  availableBoard: number;
  xIsNext: boolean;
}

export interface SocketStateUpdateMessage {
  message?: string;
  room?: string;
  state?: {
    history?: BoardState[];
  };
}

export interface MoveMadePayload {
  i: number;
  j: number;
  room: string;
}

export interface ResetBoardPayload {
  room: string;
}

export interface SendMessagePayload {
  message: string;
  room: string;
}

