import { io, Socket } from 'socket.io-client';

// Connect to your backend
const socket: Socket = io('http://localhost:8085', {
    query: {
        "room": "a"
    }
});

export default socket;

