import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  BoardState,
  Message,
  CreateRoomPayload,
  JoinRoomPayload,
  SendMessagePayload,
  PlayerRole,
  RoomStatus,
} from '../../types';
import type { RoomReconnectApi } from './useRoomReconnect';

export interface UseGameSessionResult {
  isConnected: boolean;
  currentRoom: string | null;
  playerRole: PlayerRole;
  roomStatus: RoomStatus | null;
  gameHistory: BoardState[];
  chatMessages: Message[];
  errorMessage: string | null;
  statusMessage: string;
  isInGame: boolean;
  gameIsTerminal: boolean;
  dismissError: () => void;
  createRoom: (payload: CreateRoomPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  resetBoard: () => void;
  setAlmostWon: () => void;
  leaveRoom: () => void;
}

export interface GameSessionSocketContext {
  socket: Socket;
  refs: {
    currentRoomRef: MutableRefObject<string | null>;
    playerRoleRef: MutableRefObject<PlayerRole>;
  };
  reconnect: RoomReconnectApi;
  setters: {
    setIsConnected: Dispatch<SetStateAction<boolean>>;
    setCurrentRoom: Dispatch<SetStateAction<string | null>>;
    setPlayerRole: Dispatch<SetStateAction<PlayerRole>>;
    setRoomStatus: Dispatch<SetStateAction<RoomStatus | null>>;
    setGameHistory: Dispatch<SetStateAction<BoardState[]>>;
    setChatMessages: Dispatch<SetStateAction<Message[]>>;
    setErrorMessage: Dispatch<SetStateAction<string | null>>;
    setStatusMessage: Dispatch<SetStateAction<string>>;
  };
  resetLobbyState: () => void;
}
