import { useEffect, useState, useCallback, useRef } from 'react';
import getSocket from '../../service/socket';
import { isGameTerminal } from '../../game/gameUtils';
import { createInitialGameHistory } from '../../game/initialGameState';
import { clearRoomSession } from '../../utils/roomSession';
import type {
  BoardState,
  Message,
  CreateRoomPayload,
  JoinRoomPayload,
  SetAlmostWonPayload,
  SendMessagePayload,
  PlayerRole,
  RoomStatus,
  LeaveRoomPayload,
} from '../../types';
import type { UseGameSessionResult, GameSessionSocketContext } from './types';
import { useRoomReconnect } from './useRoomReconnect';
import { registerGameSessionSocketListeners } from './socketListeners';

export type { UseGameSessionResult } from './types';

export function useGameSession(): UseGameSessionResult {
  const [socket] = useState(() => getSocket());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [gameHistory, setGameHistory] = useState<BoardState[]>(() =>
    createInitialGameHistory()
  );
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Not connected');

  const currentRoomRef = useRef<string | null>(null);
  const playerRoleRef = useRef<PlayerRole>(null);

  currentRoomRef.current = currentRoom;
  playerRoleRef.current = playerRole;

  const reconnect = useRoomReconnect(socket);

  const {
    clearReconnectTimeout,
    clearReconnectRetryTimer,
    clearReconnectFlags,
    setWasInRoom,
    wasInRoomRef,
    attemptRoomReconnect,
  } = reconnect;

  const resetLobbyState = useCallback(() => {
    clearReconnectTimeout();
    clearReconnectRetryTimer();
    clearRoomSession();
    clearReconnectFlags();
    setWasInRoom(null);
    wasInRoomRef.current = null;
    setCurrentRoom(null);
    setPlayerRole(null);
    setRoomStatus(null);
    setGameHistory(createInitialGameHistory());
    setChatMessages([]);
    setErrorMessage(null);
  }, [
    clearReconnectTimeout,
    clearReconnectRetryTimer,
    clearReconnectFlags,
    setWasInRoom,
    wasInRoomRef,
  ]);

  useEffect(() => {
    socket.connect();

    const ctx: GameSessionSocketContext = {
      socket,
      refs: { currentRoomRef, playerRoleRef },
      reconnect,
      setters: {
        setIsConnected,
        setCurrentRoom,
        setPlayerRole,
        setRoomStatus,
        setGameHistory,
        setChatMessages,
        setErrorMessage,
        setStatusMessage,
      },
      resetLobbyState,
    };

    return registerGameSessionSocketListeners(ctx);
  }, [
    socket,
    reconnect,
    resetLobbyState,
    attemptRoomReconnect,
    clearReconnectTimeout,
    clearReconnectRetryTimer,
  ]);

  const createRoom = useCallback(
    (payload: CreateRoomPayload) => {
      socket.emit('create_room', payload);
    },
    [socket]
  );

  const joinRoom = useCallback(
    (payload: JoinRoomPayload) => {
      socket.emit('join_room', payload);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload) => {
      socket.emit('send_message', payload);
    },
    [socket]
  );

  const resetBoard = useCallback(() => {
    if (currentRoom) {
      socket.emit('reset_board', {
        type: 'CLIENT',
        room: currentRoom,
        message: 'Reset requested',
      });
    }
  }, [socket, currentRoom]);

  const setAlmostWon = useCallback(() => {
    if (currentRoom) {
      const payload: SetAlmostWonPayload = {
        type: 'CLIENT',
        room: currentRoom,
        message: 'Set almost won test state',
      };
      socket.emit('set_almost_won', payload);
    }
  }, [socket, currentRoom]);

  const leaveRoom = useCallback(() => {
    if (!currentRoom) return;
    const payload: LeaveRoomPayload = {
      type: 'CLIENT',
      room: currentRoom,
      message: 'leave',
    };
    socket.emit('leave_room', payload);
  }, [socket, currentRoom]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const isInGame = roomStatus === 'IN_PROGRESS';
  const latestBoard = gameHistory[gameHistory.length - 1];
  const gameIsTerminal =
    isInGame && latestBoard ? isGameTerminal(latestBoard) : false;

  return {
    isConnected,
    currentRoom,
    playerRole,
    roomStatus,
    gameHistory,
    chatMessages,
    errorMessage,
    statusMessage,
    isInGame,
    gameIsTerminal,
    dismissError,
    createRoom,
    joinRoom,
    sendMessage,
    resetBoard,
    setAlmostWon,
    leaveRoom,
  };
}
