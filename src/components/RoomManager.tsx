import { useState } from 'react';
import { CreateRoomPayload, JoinRoomPayload } from '../types';

interface RoomManagerProps {
  onCreateRoom: (payload: CreateRoomPayload) => void;
  onJoinRoom: (payload: JoinRoomPayload) => void;
  disabled?: boolean;
}

export default function RoomManager({ onCreateRoom, onJoinRoom, disabled }: RoomManagerProps) {
  const [roomId, setRoomId] = useState<string>('');

  const handleCreateRoom = () => {
    if (roomId.trim()) {
      onCreateRoom({
        type: 'CLIENT',
        room: roomId.trim(),
        message: 'Creating room'
      });
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      onJoinRoom({
        type: 'CLIENT',
        room: roomId.trim(),
        message: 'Joining room'
      });
    }
  };

  return (
    <div className="room-manager">
      <h2>Ultimate Tic Tac Toe</h2>
      <div className="room-input-group">
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && roomId.trim()) {
              handleCreateRoom();
            }
          }}
          disabled={disabled}
          className="room-input"
        />
        <div className="room-buttons">
          <button 
            onClick={handleCreateRoom} 
            disabled={disabled || !roomId.trim()}
            className="room-button"
          >
            Create Room
          </button>
          <button 
            onClick={handleJoinRoom} 
            disabled={disabled || !roomId.trim()}
            className="room-button"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

