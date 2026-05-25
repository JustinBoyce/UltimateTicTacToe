import type { PlayerRole } from '../types';

export interface AppHeaderProps {
  isConnected: boolean;
  statusMessage: string;
  currentRoom: string | null;
  playerRole: PlayerRole;
  errorMessage: string | null;
  onDismissError: () => void;
}

export default function AppHeader({
  isConnected,
  statusMessage,
  currentRoom,
  playerRole,
  errorMessage,
  onDismissError,
}: AppHeaderProps) {
  return (
    <div className="app-header">
      <div className="status-bar">
        <span
          className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
        >
          {isConnected ? '●' : '○'}
        </span>
        <span className="status-text">{statusMessage}</span>
        {currentRoom && <span className="room-id">Room: {currentRoom}</span>}
        {playerRole && (
          <span className="player-role">You are: {playerRole}</span>
        )}
      </div>
      {errorMessage && (
        <div className="error-message" onClick={onDismissError}>
          ⚠️ {errorMessage} (click to dismiss)
        </div>
      )}
    </div>
  );
}
