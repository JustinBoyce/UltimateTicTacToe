import Game from '../game/Game';
import Chat from './Chat';
import GameControls from './GameControls';
import type { BoardState, Message, PlayerRole, SendMessagePayload } from '../types';

export interface InRoomPanelProps {
  isConnected: boolean;
  isInGame: boolean;
  gameIsTerminal: boolean;
  currentRoom: string;
  playerRole: PlayerRole;
  gameHistory: BoardState[];
  chatMessages: Message[];
  onResetBoard: () => void;
  onSetAlmostWon: () => void;
  onLeaveRoom: () => void;
  onSendMessage: (payload: SendMessagePayload) => void;
}

export default function InRoomPanel({
  isConnected,
  isInGame,
  gameIsTerminal,
  currentRoom,
  playerRole,
  gameHistory,
  chatMessages,
  onResetBoard,
  onSetAlmostWon,
  onLeaveRoom,
  onSendMessage,
}: InRoomPanelProps) {
  return (
    <div className="game-container">
      {isInGame && (
        <>
          {!gameIsTerminal && (
            <GameControls
              onResetBoard={onResetBoard}
              onSetAlmostWon={onSetAlmostWon}
            />
          )}
          <Game
            history={gameHistory}
            playerRole={playerRole}
            currentRoom={currentRoom}
            onPlayAgain={onResetBoard}
            onBackToLobby={onLeaveRoom}
          />
        </>
      )}

      <Chat
        room={currentRoom}
        onSendMessage={onSendMessage}
        messages={chatMessages}
        disabled={!isConnected}
      />

      <button
        type="button"
        onClick={onLeaveRoom}
        className="leave-room-button"
      >
        Leave Room
      </button>
    </div>
  );
}
