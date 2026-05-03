import { io, Socket } from 'socket.io-client';

// TODO: Need to review if the non-singleton approach is necessary
// Create socket instance - connection will be established when needed
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:8085');
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

