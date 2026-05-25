import RoomManager from './components/RoomManager';
import AppHeader from './components/AppHeader';
import InRoomPanel from './components/InRoomPanel';
import { useGameSession } from './hooks/useGameSession';

function App() {
  const session = useGameSession();

  return (
    <div className="app-container">
      <AppHeader
        isConnected={session.isConnected}
        statusMessage={session.statusMessage}
        currentRoom={session.currentRoom}
        playerRole={session.playerRole}
        errorMessage={session.errorMessage}
        onDismissError={session.dismissError}
      />

      {!session.currentRoom ? (
        <RoomManager
          onCreateRoom={session.createRoom}
          onJoinRoom={session.joinRoom}
          disabled={!session.isConnected}
        />
      ) : (
        <InRoomPanel
          isConnected={session.isConnected}
          isInGame={session.isInGame}
          gameIsTerminal={session.gameIsTerminal}
          currentRoom={session.currentRoom}
          playerRole={session.playerRole}
          gameHistory={session.gameHistory}
          chatMessages={session.chatMessages}
          onResetBoard={session.resetBoard}
          onSetAlmostWon={session.setAlmostWon}
          onLeaveRoom={session.leaveRoom}
          onSendMessage={session.sendMessage}
        />
      )}
    </div>
  );
}

export default App;
