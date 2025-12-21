import { useEffect, useState } from 'react';
import socket from './service/socket';
import Game from './game';

// TODO: Test server logic to make sure game is running correctly
function App() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [gameHistory, setGameHistory] = useState([{
    squares: Array.from(Array(9), () => new Array(9).fill(null)),
    bigSquares: Array(9).fill(null),
    availableBoard: 4
  }]);
  const [xIsNext, setXIsNext] = useState(true);

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
    socket.on('state_update', (data) => {
      setMessages(prev => [...prev, data]);
      // Extract game state if present in message
      if (data.state) {
        if (data.state.history) {
          setGameHistory(data.state.history);
        }
        if (data.state.xisNext !== undefined) {
          setXIsNext(data.state.xisNext);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('get_message');
      socket.off('move_made');
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

  const resetBoard = () => {
    socket.emit('reset_board', { room: "a" });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>      
      
      <button onClick={() => sendMessage("test")}>Test Message</button>
      <button onClick={() => resetBoard()}>Reset Board</button>

      <Game history={gameHistory} xIsNext={xIsNext}></Game>

      <div className="message-log">
        <h4>Incoming messages</h4>
        {messages.length === 0 && <p>No messages yet.</p>}
        {messages.map((message, idx) => (
          <div key={idx}>{"Step " + idx.toString() +  JSON.stringify(message, null, 2)}</div>
        ))}
      </div>
    </div>
  );
}

export default App;