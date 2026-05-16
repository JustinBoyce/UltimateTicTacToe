import { useState } from 'react';
import { CreateRoomPayload, JoinRoomPayload } from '../types';
import { generateRoomId, normalizeRoomId } from '../utils/roomId';

interface RoomManagerProps {
  onCreateRoom: (payload: CreateRoomPayload) => void;
  onJoinRoom: (payload: JoinRoomPayload) => void;
  disabled?: boolean;
}

export default function RoomManager({ onCreateRoom, onJoinRoom, disabled }: RoomManagerProps) {
  const [joinRoomId, setJoinRoomId] = useState<string>('');

  const handleCreateRoom = () => {
    onCreateRoom({
      type: 'CLIENT',
      room: generateRoomId(),
      message: 'Creating room',
    });
  };

  const handleJoinRoom = () => {
    const room = normalizeRoomId(joinRoomId);
    if (room) {
      onJoinRoom({
        type: 'CLIENT',
        room,
        message: 'Joining room',
      });
    }
  };

  return (
    <div className="room-manager">
      <h2>Ultimate Tic Tac Toe</h2>
      <div className="room-input-group">
        <button
          onClick={handleCreateRoom}
          disabled={disabled}
          className="room-button room-button-create"
        >
          Create Room
        </button>
        <input
          type="text"
          placeholder="Enter room code"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && joinRoomId.trim()) {
              handleJoinRoom();
            }
          }}
          disabled={disabled}
          className="room-input"
          maxLength={5}
          autoCapitalize="characters"
        />
        <button
          onClick={handleJoinRoom}
          disabled={disabled || !joinRoomId.trim()}
          className="room-button"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
