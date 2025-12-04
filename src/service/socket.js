import { io } from 'socket.io-client';

// Connect to your backend
const socket = io('http://localhost:8085', {
    query: {
        "room": "a"
    }
});

export default socket;