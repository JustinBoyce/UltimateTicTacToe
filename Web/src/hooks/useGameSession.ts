import { useEffect, useState, useCallback, useRef } from 'react';
import getSocket from '../service/socket';
import { isGameTerminal } from '../game/gameUtils';
import { createInitialGameHistory } from '../game/initialGameState';
import {
  saveRoomSession,
  loadRoomSession,
  clearRoomSession,
} from '../utils/roomSession';
import type {
  BoardState,
  RoomMessage,
  StateMessage,
  Message,
  CreateRoomPayload,
  JoinRoomPayload,
  SetAlmostWonPayload,
  SendMessagePayload,
  PlayerRole,
  RoomStatus,
  RoomClosedMessage,
  LeaveRoomPayload,
} from '../types';

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
  const [reconnectTimeout, setReconnectTimeout] = useState<number | null>(null);
  const [wasInRoom, setWasInRoom] = useState<string | null>(null);

  const currentRoomRef = useRef<string | null>(null);
  const wasInRoomRef = useRef<string | null>(null);
  const playerRoleRef = useRef<PlayerRole>(null);
  const pendingSelfReconnectRef = useRef(false);
  const reconnectRetryRef = useRef(0);
  const reconnectRetryTimerRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  currentRoomRef.current = currentRoom;
  wasInRoomRef.current = wasInRoom;
  playerRoleRef.current = playerRole;
  reconnectTimeoutRef.current = reconnectTimeout;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      setReconnectTimeout(null);
    }
  }, []);

  const attemptRoomReconnect = useCallback(
    (roomId: string) => {
      pendingSelfReconnectRef.current = true;
      socket.emit('reconnect_to_room', {
        type: 'CLIENT',
        room: roomId,
        message: 'Reconnecting',
      });
    },
    [socket]
  );

  const clearReconnectRetryTimer = useCallback(() => {
    if (reconnectRetryTimerRef.current) {
      window.clearTimeout(reconnectRetryTimerRef.current);
      reconnectRetryTimerRef.current = null;
    }
  }, []);

  const resetLobbyState = useCallback(() => {
    clearReconnectTimeout();
    clearReconnectRetryTimer();
    clearRoomSession();
    pendingSelfReconnectRef.current = false;
    reconnectRetryRef.current = 0;
    setCurrentRoom(null);
    setPlayerRole(null);
    setRoomStatus(null);
    setWasInRoom(null);
    setGameHistory(createInitialGameHistory());
    setChatMessages([]);
    setErrorMessage(null);
  }, [clearReconnectTimeout, clearReconnectRetryTimer]);

  useEffect(() => {
    socket.connect();

    const tryReconnectOnConnect = () => {
      const roomFromDisconnect = wasInRoomRef.current;
      if (roomFromDisconnect) {
        attemptRoomReconnect(roomFromDisconnect);
        return;
      }
      const stored = loadRoomSession();
      if (stored) {
        setCurrentRoom(stored.roomId);
        setPlayerRole(stored.playerRole);
        attemptRoomReconnect(stored.roomId);
      }
    };

    socket.on('connect', () => {
      setIsConnected(true);
      setStatusMessage('Connected');
      console.log('Connected:', socket.id);
      tryReconnectOnConnect();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStatusMessage('Disconnected');
      const room = currentRoomRef.current;
      if (room) {
        setWasInRoom(room);
        wasInRoomRef.current = room;
      }
    });

    socket.on('player_joined', (data: RoomMessage) => {
      const room = data.room || null;
      const role = data.playerRole || null;
      setCurrentRoom(room);
      setPlayerRole(role);
      setRoomStatus(data.roomStatus);
      setStatusMessage('Joined room');
      setErrorMessage(null);
      setWasInRoom(null);
      wasInRoomRef.current = null;
      pendingSelfReconnectRef.current = false;
      reconnectRetryRef.current = 0;
      clearReconnectRetryTimer();
      if (room && role) {
        saveRoomSession(room, role);
      }
    });

    socket.on('game_started', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Game started!');
      setErrorMessage(null);
      const room = data.room || currentRoomRef.current;
      const role = data.playerRole || playerRoleRef.current;
      if (room && role) {
        saveRoomSession(room, role);
      }
    });

    socket.on('player_disconnected', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Opponent disconnected. Waiting for reconnection...');
      clearReconnectTimeout();
      const timeout = window.setTimeout(() => {
        setStatusMessage('Opponent did not reconnect in time.');
      }, 60000);
      reconnectTimeoutRef.current = timeout;
      setReconnectTimeout(timeout);
    });

    socket.on('player_reconnected', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      const room = data.room || null;
      const role = data.playerRole || null;
      setCurrentRoom(room);
      setPlayerRole(role);
      setWasInRoom(null);
      wasInRoomRef.current = null;
      clearReconnectTimeout();
      reconnectRetryRef.current = 0;
      clearReconnectRetryTimer();
      if (pendingSelfReconnectRef.current) {
        setStatusMessage('You reconnected! Game resumed.');
        pendingSelfReconnectRef.current = false;
      } else {
        setStatusMessage('Opponent reconnected! Game resumed.');
      }
      if (room && role) {
        saveRoomSession(room, role);
      }
    });

    socket.on('room_timeout', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Opponent did not reconnect. Room closed.');
      resetLobbyState();
    });

    socket.on('room_closed', (data: RoomClosedMessage) => {
      setStatusMessage(data.message);
      resetLobbyState();
    });

    socket.on('state_update', (data: StateMessage) => {
      if (data.state && data.state.history) {
        setGameHistory(data.state.history);
      }
    });

    socket.on('get_message', (data: Message) => {
      setChatMessages((prev) => [...prev, data]);
    });

    socket.on('error', (data: Message) => {
      setErrorMessage(data.message);
      console.error('Socket error:', data.message);

      if (!pendingSelfReconnectRef.current) return;

      const roomId =
        currentRoomRef.current ??
        wasInRoomRef.current ??
        loadRoomSession()?.roomId;

      if (reconnectRetryRef.current < 2 && roomId) {
        reconnectRetryRef.current += 1;
        clearReconnectRetryTimer();
        reconnectRetryTimerRef.current = window.setTimeout(() => {
          attemptRoomReconnect(roomId);
        }, 1000);
        return;
      }

      pendingSelfReconnectRef.current = false;
      reconnectRetryRef.current = 0;
      clearReconnectRetryTimer();

      const msg = data.message.toLowerCase();
      if (
        msg.includes('reconnect') ||
        msg.includes('not exist') ||
        msg.includes('not in a room')
      ) {
        clearRoomSession();
        setWasInRoom(null);
        wasInRoomRef.current = null;
        resetLobbyState();
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_created');
      socket.off('player_joined');
      socket.off('game_started');
      socket.off('player_disconnected');
      socket.off('player_reconnected');
      socket.off('room_timeout');
      socket.off('room_closed');
      socket.off('state_update');
      socket.off('get_message');
      socket.off('error');
      clearReconnectTimeout();
      clearReconnectRetryTimer();
    };
  }, [
    socket,
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
