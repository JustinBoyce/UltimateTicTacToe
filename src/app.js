import { useEffect, useState } from 'react';
import socket from './service/socket';
import Game from './game';

function App() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect when component mounts
    socket.connect();

    // Listen for connection
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected:', socket.id);
    });

    // Listen for disconnection
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for custom events
    socket.on('get_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.disconnect();
    };
  }, []);

  const sendMessage = (text) => {
    console.log(text);
    const message = {
        message : text,
        room : "a"
    }
    socket.emit('send_message', message);
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>      
      <div className="message-log">
        <h4>Incoming messages</h4>
        {messages.length === 0 && <p>No messages yet.</p>}
        {messages.map((message, idx) => (
          <div key={idx}>{JSON.stringify(message)}</div>
        ))}
      </div>
      <button onClick={() => sendMessage("test")}>Test Message</button>

      <Game></Game>
    </div>
  );
}

export default App;