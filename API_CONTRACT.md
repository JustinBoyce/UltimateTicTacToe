# Ultimate Tic Tac Toe - Backend API Contract

## Overview

This document describes the Socket.IO-based API contract for integrating with the Ultimate Tic Tac Toe backend. The backend supports multiple concurrent game rooms, each hosting exactly two players.

**Base Connection:**
- **Host:** `localhost` (configurable via `socket-server.host`)
- **Port:** `8085` (configurable via `socket-server.port`)
- **Protocol:** Socket.IO

---

## Connection Flow

1. **Connect** to the Socket.IO server
2. **Create or Join** a room
3. **Play** the game (make moves, reset board)
4. **Handle** disconnections and reconnections

---

## Data Models

### Message
```typescript
interface Message {
  type: "SERVER" | "CLIENT" | "PLAYER_JOINED" | 
        "PLAYER_DISCONNECTED" | "PLAYER_RECONNECTED" | "ROOM_TIMEOUT" | "GAME_STARTED";
  message: string;
  room?: string;
}
```

### RoomMessage
```typescript
interface RoomMessage extends Message {
  playerRole?: "X" | "O";  // Assigned when joining
  roomStatus: "WAITING_FOR_PLAYER" | "IN_PROGRESS" | "WAITING_RECONNECT" | "ENDED";
}
```

### MoveMade
```typescript
interface MoveMade {
  type: "CLIENT";
  room: string;
  i: number;  // Square index (0-8) within the board
  j: number;  // Board index (0-8) within the 3x3 grid
}
```

### State
```typescript
interface State {
  history: BoardState[];
}

interface BoardState {
  squares: (string | null)[][];  // 9x9 grid: 9 boards, each with 9 squares
  bigSquares: (string | null)[];  // 9-element array for the 3x3 meta-board
  availableBoard: number;  // 0-8 for specific board, 4 means any board
  xIsNext: boolean;  // true if X's turn, false if O's turn
}
```

### StateMessage
```typescript
interface StateMessage extends Message {
  state: State;
}
```

### RoomStatus Enum
```typescript
enum RoomStatus {
  WAITING_FOR_PLAYER,  // Room created, waiting for second player
  IN_PROGRESS,         // Game is active
  WAITING_RECONNECT,   // One player disconnected, waiting for reconnection
  ENDED                // Game ended (timeout or both players left)
}
```

---

## Client → Server Events

### `create_room`
Creates a new game room and automatically adds the creator as player 1 (X). The creator is immediately added to the room and assigned the "X" role.

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,  // Room ID (e.g., "room-123")
  message?: string
}
```

**Response Events:**
- Success: `player_joined` (RoomMessage) - includes `playerRole: "X"` and `roomStatus: "WAITING_FOR_PLAYER"`
- Error: `error` (Message)

**Example:**
```javascript
socket.emit('create_room', {
  type: 'CLIENT',
  room: 'room-123',
  message: 'Creating room'
});

// Response will include your role as "X"
socket.on('player_joined', (data) => {
  console.log('Room created! You are:', data.playerRole); // "X"
  console.log('Room status:', data.roomStatus); // "WAITING_FOR_PLAYER"
});
```

---

### `join_room`
Joins an existing room. If the room is full, the request will be rejected.

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,  // Room ID to join
  message?: string
}
```

**Response Events:**
- Success: `player_joined` (RoomMessage) - includes `playerRole` ("X" or "O")
- If room becomes full: `game_started` (RoomMessage) + `state_update` (StateMessage) - sent to both players
- Error: `error` (Message)

**Example:**
```javascript
socket.emit('join_room', {
  type: 'CLIENT',
  room: 'room-123',
  message: 'Joining room'
});
```

---

### `reconnect_to_room`
Reconnects a player to a room after disconnection. Must be called within 60 seconds of disconnection.

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,  // Room ID to reconnect to
  message?: string
}
```

**Response Events:**
- Success: `player_reconnected` (RoomMessage) + `state_update` (StateMessage) - sent to both players
- Error: `error` (Message)

**Example:**
```javascript
socket.emit('reconnect_to_room', {
  type: 'CLIENT',
  room: 'room-123',
  message: 'Reconnecting'
});
```

---

### `move_made`
Makes a move in the game. Only valid if:
- Room exists and is IN_PROGRESS
- Player is in the room
- It's the player's turn

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,
  i: number,  // Square index (0-8) within the board
  j: number  // Board index (0-8) within the 3x3 grid
}
```

**Response Events:**
- Success: `state_update` (StateMessage) - sent to all players in the room
- Error: `error` (Message) - if move is invalid, not player's turn, or room issues

**Example:**
```javascript
socket.emit('move_made', {
  type: 'CLIENT',
  room: 'room-123',
  i: 4,  // Center square of the board
  j: 0   // First board (top-left)
});
```

**Move Validation:**
- `i` must be 0-8 (square within board)
- `j` must be 0-8 (board within 3x3 grid)
- Move must be on the `availableBoard` (or any board if `availableBoard === 4`)
- Square must be empty
- Board must not be won or tied
- Must be the player's turn

---

### `reset_board`
Resets the game board to initial state. Only valid if player is in the room.

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,
  message?: string
}
```

**Response Events:**
- Success: `state_update` (StateMessage) - sent to all players in the room
- Error: `error` (Message)

**Example:**
```javascript
socket.emit('reset_board', {
  type: 'CLIENT',
  room: 'room-123',
  message: 'Reset requested'
});
```

---

### `send_message`
Sends a chat message to other players in the room.

**Payload:**
```typescript
{
  type: "CLIENT",
  room: string,
  message: string
}
```

**Response Events:**
- Success: `get_message` (Message) - sent to other players in the room (not sender)

**Example:**
```javascript
socket.emit('send_message', {
  type: 'CLIENT',
  room: 'room-123',
  message: 'Hello!'
});
```

---

## Server → Client Events

---

### `player_joined`
Emitted when a player successfully joins a room.

**Payload:** RoomMessage
```typescript
{
  type: "PLAYER_JOINED",
  message: "Joined room successfully",
  room: string,
  playerRole: "X" | "O",  // Assigned role
  roomStatus: "WAITING_FOR_PLAYER" | "IN_PROGRESS"
}
```

**Note:** If `roomStatus` is `"IN_PROGRESS"`, the room is now full and the game will start.

---

### `game_started`
Emitted to both players when the second player joins and the game begins.

**Payload:** RoomMessage
```typescript
{
  type: "GAME_STARTED",
  message: "Game started",
  room: string,
  playerRole: "X" | "O",  // Your role
  roomStatus: "IN_PROGRESS"
}
```

**Always followed by:** `state_update` with the initial game state.

---

### `state_update`
Emitted whenever the game state changes (move made, board reset, reconnection).

**Payload:** StateMessage
```typescript
{
  type: "SERVER",
  message: string,
  room: string,
  state: State  // Current game state
}
```

**When received:**
- After a move is made
- After board reset
- After reconnection (to sync state)
- When game starts

---

### `player_disconnected`
Emitted to the remaining player when their opponent disconnects.

**Payload:** RoomMessage
```typescript
{
  type: "PLAYER_DISCONNECTED",
  message: "Player disconnected. Waiting for reconnection...",
  room: string,
  playerRole: "X" | "O",  // Your role
  roomStatus: "WAITING_RECONNECT"
}
```

**Reconnection Window:** 60 seconds. If opponent doesn't reconnect, `room_timeout` will be emitted.

---

### `player_reconnected`
Emitted to both players when a disconnected player successfully reconnects.

**Payload:** RoomMessage
```typescript
{
  type: "PLAYER_RECONNECTED",
  message: "Player reconnected. Game resumed.",
  room: string,
  playerRole: "X" | "O",  // Your role
  roomStatus: "IN_PROGRESS"
}
```

**Always followed by:** `state_update` with the current game state.

---

### `room_timeout`
Emitted to the remaining player if the disconnected player doesn't reconnect within 60 seconds.

**Payload:** RoomMessage
```typescript
{
  type: "ROOM_TIMEOUT",
  message: "Opponent did not reconnect in time. Room closed.",
  room: string,
  playerRole: "X" | "O",  // Your role
  roomStatus: "ENDED"
}
```

**After this event:** The room is cleaned up and no longer exists.

---

### `error`
Emitted when an error occurs (invalid request, room full, etc.).

**Payload:** Message
```typescript
{
  type: "SERVER",
  message: string,  // Error description
  room?: string
}
```

**Common Error Messages:**
- `"Room ID is required"`
- `"Room already exists"`
- `"Room does not exist"`
- `"Failed to join room. Room may not exist or be full."`
- `"You are not in this room"`
- `"Game is not in progress"`
- `"Not your turn"`
- `"Invalid move"`
- `"Failed to reconnect. Room may not exist or you are not the disconnected player."`

---

### `get_message`
Emitted when a chat message is received from another player.

**Payload:** Message
```typescript
{
  type: "SERVER",
  message: string,  // Chat message content
  room: string
}
```

---

## Game Flow Examples

### Example 1: Creating and Joining a Room

**Player 1 (Host):**
```javascript
// 1. Connect
const socket = io('http://localhost:8085');

// 2. Create room (automatically added as player X)
socket.emit('create_room', {
  type: 'CLIENT',
  room: 'room-abc123'
});

// 3. Listen for confirmation
socket.on('player_joined', (data) => {
  console.log('Room created! You are:', data.playerRole); // "X"
  console.log('Room status:', data.roomStatus); // "WAITING_FOR_PLAYER"
  // You are now player 1 (X) and waiting for opponent
});

// 4. Wait for second player...
socket.on('game_started', (data) => {
  console.log('Game started! You are:', data.playerRole); // "X"
  // Status: IN_PROGRESS
});

socket.on('state_update', (data) => {
  // Update game board UI
  updateBoard(data.state);
});
```

**Player 2 (Joiner):**
```javascript
// 1. Connect
const socket = io('http://localhost:8085');

// 2. Join room
socket.emit('join_room', {
  type: 'CLIENT',
  room: 'room-abc123'
});

// 3. Listen for confirmation
socket.on('player_joined', (data) => {
  console.log('Joined room! You are:', data.playerRole);
  // Status: IN_PROGRESS (room is now full)
});

socket.on('game_started', (data) => {
  console.log('Game started! You are:', data.playerRole);
});

socket.on('state_update', (data) => {
  // Update game board UI
  updateBoard(data.state);
});
```

---

### Example 2: Making a Move

```javascript
// Make a move (square 4 in board 0)
socket.emit('move_made', {
  type: 'CLIENT',
  room: 'room-abc123',
  i: 4,  // Center square
  j: 0   // First board
});

// Listen for state update
socket.on('state_update', (data) => {
  const currentBoard = data.state.history[data.state.history.length - 1];
  console.log('Current turn:', currentBoard.xIsNext ? 'X' : 'O');
  console.log('Available board:', currentBoard.availableBoard);
  // Update UI
});

// Handle errors
socket.on('error', (data) => {
  console.error('Error:', data.message);
  // Show error to user
});
```

---

### Example 3: Handling Disconnection and Reconnection

**When opponent disconnects:**
```javascript
socket.on('player_disconnected', (data) => {
  console.log('Opponent disconnected. Waiting for reconnection...');
  // Show "Waiting for opponent..." message
  // Start 60-second countdown
});
```

**When opponent reconnects:**
```javascript
socket.on('player_reconnected', (data) => {
  console.log('Opponent reconnected!');
  // Hide "Waiting..." message
  // Resume game
});

socket.on('state_update', (data) => {
  // Sync game state after reconnection
  updateBoard(data.state);
});
```

**If timeout occurs:**
```javascript
socket.on('room_timeout', (data) => {
  console.log('Opponent did not reconnect. Room closed.');
  // Show "Game ended" message
  // Allow player to create/join new room
});
```

**Reconnecting after disconnection:**
```javascript
// After reconnecting to socket
socket.on('connect', () => {
  // Reconnect to your room
  socket.emit('reconnect_to_room', {
    type: 'CLIENT',
    room: 'room-abc123'  // Your previous room ID
  });
});

socket.on('player_reconnected', (data) => {
  console.log('You reconnected successfully!');
});

socket.on('error', (data) => {
  if (data.message.includes('reconnect')) {
    console.error('Reconnection failed:', data.message);
    // Room may have timed out or doesn't exist
  }
});
```

---

## Important Notes

1. **Room IDs:** Must be unique strings. Frontend should generate unique IDs (UUIDs, timestamps, etc.).

2. **Player Roles:** 
   - First player to create/join becomes **X**
   - Second player becomes **O**
   - Roles are fixed for the duration of the game

3. **Reconnection Window:** 60 seconds from disconnection. After timeout, the room is closed.

4. **Game State:** Always use the last element of `state.history` for the current board state.

5. **Turn Management:** Check `boardState.xIsNext` to determine whose turn it is. Only allow moves when it's the player's turn.

6. **Available Board:** 
   - `availableBoard === 4` means any board can be played
   - `availableBoard === 0-8` means only that specific board can be played
   - Frontend should highlight/disable boards accordingly

7. **Error Handling:** Always listen for `error` events and handle them appropriately.

8. **Multiple Rooms:** The backend supports multiple rooms running simultaneously. Each room operates independently.

---

## Connection Lifecycle

```
1. Connect → socket.connect()
2. Create/Join Room → create_room or join_room
3. Game Starts → game_started + state_update
4. Play Game → move_made → state_update
5. (Optional) Reset → reset_board → state_update
6. Disconnect → player_disconnected (to opponent)
7. Reconnect → reconnect_to_room → player_reconnected + state_update
8. Timeout (if no reconnect) → room_timeout → ENDED
```

---

## Testing Checklist

- [ ] Create room successfully
- [ ] Join room successfully
- [ ] Reject joining full room
- [ ] Make valid moves
- [ ] Reject invalid moves (wrong turn, invalid board/square)
- [ ] Reset board
- [ ] Handle opponent disconnection
- [ ] Reconnect within timeout window
- [ ] Handle timeout after 60 seconds
- [ ] Multiple rooms running simultaneously
- [ ] Chat messages between players

---

## Configuration

The backend can be configured via `application.properties`:
- `socket-server.host` - Server hostname (default: `localhost`)
- `socket-server.port` - Server port (default: `8085`)

Frontend should use these values to construct the Socket.IO connection URL:
```javascript
const socket = io(`http://${host}:${port}`);
```

