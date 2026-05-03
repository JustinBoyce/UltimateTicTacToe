// Type definitions for the Ultimate Tic Tac Toe game

export type SquareValue = 'X' | 'O' | null | '/';
export type PlayerRole = 'X' | 'O' | null;
export type RoomStatus = 'WAITING_FOR_PLAYER' | 'IN_PROGRESS' | 'WAITING_RECONNECT' | 'ENDED';
export type MessageType = 'SERVER' | 'CLIENT' | 'ROOM_CREATED' | 'PLAYER_JOINED' | 
  'PLAYER_DISCONNECTED' | 'PLAYER_RECONNECTED' | 'ROOM_TIMEOUT' | 'GAME_STARTED';

export interface BoardState {
  squares: SquareValue[][];
  bigSquares: SquareValue[];
  availableBoard: number;
  xIsNext: boolean;
}

export interface State {
  history: BoardState[];
}

export interface Message {
  type: MessageType;
  message: string;
  room?: string;
}

export interface RoomMessage extends Message {
  playerRole?: PlayerRole;
  roomStatus: RoomStatus;
}

export interface MoveMade {
  type: 'CLIENT';
  room: string;
  i: number;  // Square index (0-8) within the board
  j: number;  // Board index (0-8) within the 3x3 grid
}

export interface StateMessage extends Message {
  state: State;
}

// Client event payloads
export interface CreateRoomPayload {
  type: 'CLIENT';
  room: string;
  message?: string;
}

export interface JoinRoomPayload {
  type: 'CLIENT';
  room: string;
  message?: string;
}

export interface ReconnectToRoomPayload {
  type: 'CLIENT';
  room: string;
  message?: string;
}

export interface MoveMadePayload {
  type: 'CLIENT';
  room: string;
  i: number;
  j: number;
}

export interface ResetBoardPayload {
  type: 'CLIENT';
  room: string;
  message?: string;
}

export interface SendMessagePayload {
  type: 'CLIENT';
  room: string;
  message: string;
}

