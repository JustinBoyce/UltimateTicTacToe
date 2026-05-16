import {
  saveRoomSession,
  loadRoomSession,
  clearRoomSession,
} from '../../utils/roomSession';
import type {
  RoomMessage,
  StateMessage,
  Message,
  RoomClosedMessage,
} from '../../types';
import type { GameSessionSocketContext } from './types';

const SOCKET_EVENTS = [
  'connect',
  'disconnect',
  'player_joined',
  'game_started',
  'player_disconnected',
  'player_reconnected',
  'room_timeout',
  'room_closed',
  'state_update',
  'get_message',
  'error',
] as const;

export function registerGameSessionSocketListeners(
  ctx: GameSessionSocketContext
): () => void {
  const { socket, refs, reconnect, setters, resetLobbyState } = ctx;
  const { currentRoomRef, playerRoleRef } = refs;
  const {
    wasInRoomRef,
    pendingSelfReconnectRef,
    reconnectRetryRef,
    reconnectRetryTimerRef,
    setWasInRoom,
    clearReconnectTimeout,
    clearReconnectRetryTimer,
    attemptRoomReconnect,
    setOpponentDisconnectTimer,
  } = reconnect;
  const {
    setIsConnected,
    setCurrentRoom,
    setPlayerRole,
    setRoomStatus,
    setGameHistory,
    setChatMessages,
    setErrorMessage,
    setStatusMessage,
  } = setters;

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
    reconnect.clearReconnectFlags();
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
    setOpponentDisconnectTimer(() => {
      setStatusMessage('Opponent did not reconnect in time.');
    });
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
    reconnect.clearReconnectFlags();
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
    for (const event of SOCKET_EVENTS) {
      socket.off(event);
    }
    clearReconnectTimeout();
    clearReconnectRetryTimer();
  };
}
