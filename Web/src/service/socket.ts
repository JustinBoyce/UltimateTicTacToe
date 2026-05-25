import { io, Socket } from 'socket.io-client';

// TODO: Need to review if the non-singleton approach is necessary
// Create socket instance - connection will be established when needed
let socket: Socket | null = null;

function resolveSocketUrl(): string {
  const fromEnv = import.meta.env.VITE_SOCKET_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8085';
  }
  throw new Error(
    'Missing VITE_SOCKET_URL: set it in Web/.env.production (or .env.production.local) before building for production. See Web/.env.example and FRONTEND.md.',
  );
}

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(resolveSocketUrl());
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
