import { useEffect, useState } from 'react';
import socket from './service/socket';
import Game from './game/Game';
import { SocketStateUpdateMessage, BoardState } from './types';

// TODO: Test server logic to make sure game is running correctly
function App() {
  const [messages, setMessages] = useState<SocketStateUpdateMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<BoardState[]>([{
    squares: Array.from(Array(9), () => new Array(9).fill(null)),
    bigSquares: Array(9).fill(null),
    availableBoard: 4,
    xIsNext: true
  }]);

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
    socket.on('state_update', (data: SocketStateUpdateMessage) => {
      setMessages(prev => [...prev, data]);
      // Extract game state if present in message
      if (data.state) {
        if (data.state.history) {
          setGameHistory(data.state.history);
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

  const sendMessage = (text: string): void => {
    console.log(text);
    const message = {
        message : text,
        room : "a"
    }
    socket.emit('send_message', message);
  };

  const resetBoard = (): void => {
    socket.emit('reset_board', { room: "a" });
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>      
      
      <button onClick={() => sendMessage("test")}>Test Message</button>
      <button onClick={() => resetBoard()}>Reset Board</button>

      <Game history={gameHistory}></Game>

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

