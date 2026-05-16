import { useEffect, useState, useCallback } from 'react';
import getSocket from './service/socket';
import Game from './game/Game';
import RoomManager from './components/RoomManager';
import Chat from './components/Chat';
import GameControls from './components/GameControls';
import { isGameTerminal } from './game/gameUtils';
import { 
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
} from './types';

function createInitialGameHistory(): BoardState[] {
  return [
    {
      squares: Array.from(Array(9), () => new Array(9).fill(null)),
      bigSquares: Array(9).fill(null),
      availableBoard: 4,
      xIsNext: true,
    },
  ];
}

// TODO: Refactor to potentially get rid of some of this state in the App component
//       Probably need a separate component for handling all of the socket events
function App() {
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

  const resetLobbyState = useCallback(() => {
    setReconnectTimeout((prev) => {
      if (prev) window.clearTimeout(prev);
      return null;
    });
    setCurrentRoom(null);
    setPlayerRole(null);
    setRoomStatus(null);
    setWasInRoom(null);
    setGameHistory(createInitialGameHistory());
    setChatMessages([]);
    setErrorMessage(null);
  }, []);

  // Connection handlers
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setStatusMessage('Connected');
      console.log('Connected:', socket.id);
      // If we were in a room before disconnection, try to reconnect
      // The backend will validate if reconnection is allowed
      if (wasInRoom) {
        socket.emit('reconnect_to_room', {
          type: 'CLIENT',
          room: wasInRoom,
          message: 'Reconnecting after socket reconnection'
        });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStatusMessage('Disconnected');
      // Save current room state for reconnection
      if (currentRoom) {
        setWasInRoom(currentRoom);
      }
    });

    // Room events
    socket.on('player_joined', (data: RoomMessage) => {
      setCurrentRoom(data.room || null);
      setPlayerRole(data.playerRole || null);
      setRoomStatus(data.roomStatus);
      setStatusMessage('Joined room');
      setErrorMessage(null);
      setWasInRoom(null); // Clear reconnection flag
    });

    socket.on('game_started', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Game started!');
      setErrorMessage(null);
    });

    socket.on('player_disconnected', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Opponent disconnected. Waiting for reconnection...');
      // Start 60 second countdown
      const timeout = window.setTimeout(() => {
        setStatusMessage('Opponent did not reconnect in time.');
      }, 60000);
      setReconnectTimeout(timeout);
    });

    socket.on('player_reconnected', (data: RoomMessage) => {
      setRoomStatus(data.roomStatus);
      setStatusMessage('Opponent reconnected! Game resumed.');
      setCurrentRoom(data.room || null);
      setPlayerRole(data.playerRole || null);
      setWasInRoom(null); // Clear reconnection flag
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        setReconnectTimeout(null);
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

    // Game state events
    socket.on('state_update', (data: StateMessage) => {
      if (data.state && data.state.history) {
        setGameHistory(data.state.history);
      }
    });

    // Chat events
    socket.on('get_message', (data: Message) => {
      setChatMessages(prev => [...prev, data]);
    });

    // Error handling
    socket.on('error', (data: Message) => {
      setErrorMessage(data.message);
      console.error('Socket error:', data.message);
    });

    // Cleanup
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
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [socket, reconnectTimeout, resetLobbyState]);

  // Room management handlers
  const handleCreateRoom = useCallback((payload: CreateRoomPayload) => {
    socket.emit('create_room', payload);
  }, [socket]);

  const handleJoinRoom = useCallback((payload: JoinRoomPayload) => {
    socket.emit('join_room', payload);
  }, [socket]);

  const handleReconnect = useCallback(() => {
    if (currentRoom) {
      socket.emit('reconnect_to_room', {
        type: 'CLIENT',
        room: currentRoom,
        message: 'Reconnecting'
      });
    }
  }, [socket, currentRoom]);

  // Game handlers
  const handleSendMessage = useCallback((payload: SendMessagePayload) => {
    socket.emit('send_message', payload);
  }, [socket]);

  const handleResetBoard = useCallback(() => {
    if (currentRoom) {
      socket.emit('reset_board', {
        type: 'CLIENT',
        room: currentRoom,
        message: 'Reset requested'
      });
    }
  }, [socket, currentRoom]);

  const handleSetAlmostWon = useCallback(() => {
    if (currentRoom) {
      const payload: SetAlmostWonPayload = {
        type: 'CLIENT',
        room: currentRoom,
        message: 'Set almost won test state'
      };
      socket.emit('set_almost_won', payload);
    }
  }, [socket, currentRoom]);

  const handleLeaveRoom = useCallback(() => {
    if (!currentRoom) return;
    const payload: LeaveRoomPayload = {
      type: 'CLIENT',
      room: currentRoom,
      message: 'leave',
    };
    socket.emit('leave_room', payload);
  }, [socket, currentRoom]);

  const isInGame = roomStatus === 'IN_PROGRESS';
  const isWaiting = roomStatus === 'WAITING_FOR_PLAYER' || roomStatus === 'WAITING_RECONNECT';
  const latestBoard = gameHistory[gameHistory.length - 1];
  const gameIsTerminal =
    isInGame && latestBoard ? isGameTerminal(latestBoard) : false;

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="status-bar">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '●' : '○'}
          </span>
          <span className="status-text">{statusMessage}</span>
          {currentRoom && (
            <span className="room-id">Room: {currentRoom}</span>
          )}
          {playerRole && (
            <span className="player-role">You are: {playerRole}</span>
          )}
        </div>
        {errorMessage && (
          <div className="error-message" onClick={() => setErrorMessage(null)}>
            ⚠️ {errorMessage} (click to dismiss)
          </div>
        )}
      </div>

      {!currentRoom ? (
        <RoomManager 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          disabled={!isConnected}
        />
      ) : (
        <div className="game-container">
          {isWaiting && roomStatus === 'WAITING_RECONNECT' && (
            <div className="reconnect-prompt">
              <p>Opponent disconnected. Attempting to reconnect...</p>
              <button onClick={handleReconnect}>Manual Reconnect</button>
            </div>
          )}
          
          {isInGame && (
            <>
              {!gameIsTerminal && (
                <GameControls
                  onResetBoard={handleResetBoard}
                  onSetAlmostWon={handleSetAlmostWon}
                />
              )}
              <Game 
                history={gameHistory}
                playerRole={playerRole}
                currentRoom={currentRoom}
                onPlayAgain={handleResetBoard}
                onBackToLobby={handleLeaveRoom}
              />
            </>
          )}

          {currentRoom && (
            <Chat
              room={currentRoom}
              onSendMessage={handleSendMessage}
              messages={chatMessages}
              disabled={!isConnected}
            />
          )}

          <button 
            type="button"
            onClick={handleLeaveRoom}
            className="leave-room-button"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

