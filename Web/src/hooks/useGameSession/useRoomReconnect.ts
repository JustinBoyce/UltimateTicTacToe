import { useState, useRef, useCallback, useMemo } from 'react';
import type { Socket } from 'socket.io-client';
import type { MutableRefObject } from 'react';
import { loadRoomSession } from '../../utils/roomSession';

export interface RoomReconnectApi {
  wasInRoomRef: MutableRefObject<string | null>;
  reconnectTimeoutRef: MutableRefObject<number | null>;
  pendingSelfReconnectRef: MutableRefObject<boolean>;
  reconnectRetryRef: MutableRefObject<number>;
  reconnectRetryTimerRef: MutableRefObject<number | null>;
  setWasInRoom: (value: string | null) => void;
  clearReconnectTimeout: () => void;
  clearReconnectRetryTimer: () => void;
  attemptRoomReconnect: (roomId: string, playerToken?: string) => void;
  clearReconnectFlags: () => void;
  setOpponentDisconnectTimer: (onExpire: () => void) => void;
}

export function useRoomReconnect(socket: Socket): RoomReconnectApi {
  const [reconnectTimeout, setReconnectTimeout] = useState<number | null>(null);
  const [wasInRoom, setWasInRoom] = useState<string | null>(null);

  const wasInRoomRef = useRef<string | null>(null);
  const pendingSelfReconnectRef = useRef(false);
  const reconnectRetryRef = useRef(0);
  const reconnectRetryTimerRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  wasInRoomRef.current = wasInRoom;
  reconnectTimeoutRef.current = reconnectTimeout;

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      setReconnectTimeout(null);
    }
  }, []);

  const clearReconnectRetryTimer = useCallback(() => {
    if (reconnectRetryTimerRef.current) {
      window.clearTimeout(reconnectRetryTimerRef.current);
      reconnectRetryTimerRef.current = null;
    }
  }, []);

  const attemptRoomReconnect = useCallback(
    (roomId: string, playerToken?: string) => {
      const token = playerToken ?? loadRoomSession()?.playerToken;
      if (!token) {
        pendingSelfReconnectRef.current = false;
        return;
      }
      pendingSelfReconnectRef.current = true;
      socket.emit('reconnect_to_room', {
        type: 'CLIENT',
        room: roomId,
        playerToken: token,
        message: 'Reconnecting',
      });
    },
    [socket]
  );

  const clearReconnectFlags = useCallback(() => {
    pendingSelfReconnectRef.current = false;
    reconnectRetryRef.current = 0;
  }, []);

  const setOpponentDisconnectTimer = useCallback(
    (onExpire: () => void) => {
      clearReconnectTimeout();
      const timeout = window.setTimeout(onExpire, 60000);
      reconnectTimeoutRef.current = timeout;
      setReconnectTimeout(timeout);
    },
    [clearReconnectTimeout]
  );

  return useMemo(
    () => ({
      wasInRoomRef,
      reconnectTimeoutRef,
      pendingSelfReconnectRef,
      reconnectRetryRef,
      reconnectRetryTimerRef,
      setWasInRoom,
      clearReconnectTimeout,
      clearReconnectRetryTimer,
      attemptRoomReconnect,
      clearReconnectFlags,
      setOpponentDisconnectTimer,
    }),
    [
      clearReconnectTimeout,
      clearReconnectRetryTimer,
      attemptRoomReconnect,
      clearReconnectFlags,
      setOpponentDisconnectTimer,
    ]
  );
}
