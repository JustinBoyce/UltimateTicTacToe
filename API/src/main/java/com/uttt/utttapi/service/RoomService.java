package com.uttt.utttapi.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.messages.MessageType;
import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.serverMessages.RoomClosedMessage;
import com.uttt.utttapi.messages.serverMessages.RoomMessage;
import com.uttt.utttapi.messages.serverMessages.StateMessage;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.room.RoomStatus;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final Map<UUID, String> playerToRoom = new ConcurrentHashMap<>(); // sessionId -> roomId
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private static final long RECONNECTION_TIMEOUT_SECONDS = 60;

    private final SocketIOServer server;

    public RoomService(SocketIOServer server) {
        this.server = server;
        // Start periodic cleanup task
        scheduler.scheduleAtFixedRate(this::checkReconnectionTimeouts, 5, 5, TimeUnit.SECONDS);
    }

    public Room createRoom(String roomId) {
        if (rooms.containsKey(roomId)) {
            log.warn("Room {} already exists", roomId);
            return null;
        }
        Room room = new Room(roomId);
        rooms.put(roomId, room);
        log.info("Room {} created", roomId);
        return room;
    }

    public Room joinRoom(String roomId, SocketIOClient client) {
        Room room = rooms.get(roomId);
        if (room == null) {
            log.warn("Room {} does not exist", roomId);
            return null;
        }

        if (room.isFull()) {
            log.warn("Room {} is already full", roomId);
            return null;
        }

        UUID sessionId = client.getSessionId();
        
        // Check if player is already in another room
        if (playerToRoom.containsKey(sessionId)) {
            String existingRoomId = playerToRoom.get(sessionId);
            if (!existingRoomId.equals(roomId)) {
                log.warn("Player {} is already in room {}", sessionId, existingRoomId);
                return null;
            }
            // Reconnecting to same room
            return handleReconnect(client, roomId);
        }

        // Add player to room
        if (room.getPlayer1() == null) {
            room.setPlayer1(client);
            playerToRoom.put(sessionId, roomId);
            client.joinRoom(roomId);
            log.info("Player {} joined room {} as player 1 (X)", sessionId, roomId);
        } else if (room.getPlayer2() == null) {
            room.setPlayer2(client);
            playerToRoom.put(sessionId, roomId);
            client.joinRoom(roomId);
            room.setStatus(RoomStatus.IN_PROGRESS);
            log.info("Player {} joined room {} as player 2 (O)", sessionId, roomId);
            
            // Send game started event to both players
            State initialState = room.getGame().getState();
            for (SocketIOClient roomClient : server.getRoomOperations(roomId).getClients()) {
                String role = room.getPlayerRole(roomClient);
                roomClient.sendEvent("game_started", new RoomMessage(
                    MessageType.SERVER, 
                    "Game started", 
                    roomId, 
                    role, 
                    RoomStatus.IN_PROGRESS
                ));
                roomClient.sendEvent("state_update", new StateMessage(initialState));
            }
        }

        room.updateActivity();
        return room;
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public UltimateTicTacToe getGame(String roomId) {
        Room room = rooms.get(roomId);
        return room != null ? room.getGame() : null;
    }

    public void handleDisconnect(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        String roomId = playerToRoom.get(sessionId);
        
        if (roomId == null) {
            log.info("Client {} disconnected but was not in any room", sessionId);
            return;
        }

        Room room = rooms.get(roomId);
        if (room == null) {
            log.warn("Room {} not found for disconnected client {}", roomId, sessionId);
            playerToRoom.remove(sessionId);
            return;
        }

        // Mark player as disconnected
        if (room.getPlayer1() != null && room.getPlayer1().getSessionId().equals(sessionId)) {
            room.setDisconnectedPlayerId(sessionId);
        } else if (room.getPlayer2() != null && room.getPlayer2().getSessionId().equals(sessionId)) {
            room.setDisconnectedPlayerId(sessionId);
        }

        // If room is in progress, set to waiting reconnect
        if (room.getStatus() == RoomStatus.IN_PROGRESS) {
            room.setStatus(RoomStatus.WAITING_RECONNECT);
            room.setDisconnectTime(Instant.now());
            
            // Notify other player
            SocketIOClient otherPlayer = room.getOtherPlayer(client);
            if (otherPlayer != null) {
                otherPlayer.sendEvent("player_disconnected", new RoomMessage(
                    MessageType.SERVER,
                    "Player disconnected. Waiting for reconnection...",
                    roomId,
                    room.getPlayerRole(otherPlayer),
                    RoomStatus.WAITING_RECONNECT
                ));
            }
            log.info("Player {} disconnected from room {}. Waiting for reconnection...", sessionId, roomId);
        } else {
            // If room was waiting for player, just remove it
            cleanupRoom(roomId);
        }
    }

    public Room handleReconnect(SocketIOClient client, String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            log.warn("Room {} does not exist for reconnection", roomId);
            return null;
        }

        UUID sessionId = client.getSessionId();
        
        // Verify this is the disconnected player
        if (!sessionId.equals(room.getDisconnectedPlayerId())) {
            log.warn("Client {} is not the disconnected player for room {}", sessionId, roomId);
            return null;
        }

        // Restore connection - update player reference with new client instance
        if (room.getPlayer1() != null && room.getPlayer1().getSessionId().equals(sessionId)) {
            // Player1 reconnected - update reference with new client instance
            room.setPlayer1(client);
        } else if (room.getPlayer2() != null && room.getPlayer2().getSessionId().equals(sessionId)) {
            // Player2 reconnected - update reference with new client instance
            room.setPlayer2(client);
        }

        // Rejoin room
        client.joinRoom(roomId);
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setDisconnectedPlayerId(null);
        room.setDisconnectTime(null);
        room.updateActivity();

        // Notify both players
        State currentState = room.getGame().getState();
        for (SocketIOClient roomClient : server.getRoomOperations(roomId).getClients()) {
            String role = room.getPlayerRole(roomClient);
            roomClient.sendEvent("player_reconnected", new RoomMessage(
                MessageType.SERVER,
                "Player reconnected. Game resumed.",
                roomId,
                role,
                RoomStatus.IN_PROGRESS
            ));
            roomClient.sendEvent("state_update", new StateMessage(currentState));
        }

        log.info("Player {} reconnected to room {}", sessionId, roomId);
        return room;
    }

    public void leaveRoom(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        String roomId = playerToRoom.get(sessionId);
        if (roomId == null) {
            log.warn("leave_room: client {} not in any room", sessionId);
            client.sendEvent("error", new Message(MessageType.SERVER, "Not in a room"));
            return;
        }

        Room room = rooms.get(roomId);
        if (room == null || !room.containsPlayer(client)) {
            playerToRoom.remove(sessionId);
            client.sendEvent("error", new Message(MessageType.SERVER, "Room not found"));
            log.warn("leave_room: stale mapping for client {}", sessionId);
            return;
        }

        SocketIOClient other = room.getOtherPlayer(client);
        if (other != null) {
            other.sendEvent("room_closed", new RoomClosedMessage(
                    MessageType.SERVER,
                    "Opponent left. Room closed.",
                    roomId,
                    "opponent_left"));
        }
        client.sendEvent("room_closed", new RoomClosedMessage(
                MessageType.SERVER,
                "You left the room.",
                roomId,
                "self_left"));

        cleanupRoom(roomId);
        log.info("Client {} left room {} (room dissolved)", sessionId, roomId);
    }

    public void cleanupRoom(String roomId) {
        Room room = rooms.remove(roomId);
        if (room != null) {
            if (room.getPlayer1() != null) {
                room.getPlayer1().leaveRoom(roomId);
                playerToRoom.remove(room.getPlayer1().getSessionId());
            }
            if (room.getPlayer2() != null) {
                room.getPlayer2().leaveRoom(roomId);
                playerToRoom.remove(room.getPlayer2().getSessionId());
            }
            log.info("Room {} cleaned up", roomId);
        }
    }

    private void checkReconnectionTimeouts() {
        Instant now = Instant.now();
        rooms.entrySet().removeIf(entry -> {
            Room room = entry.getValue();
            if (room.getStatus() == RoomStatus.WAITING_RECONNECT && room.getDisconnectTime() != null) {
                long elapsedSeconds = now.getEpochSecond() - room.getDisconnectTime().getEpochSecond();
                if (elapsedSeconds >= RECONNECTION_TIMEOUT_SECONDS) {
                    // Timeout expired
                    room.setStatus(RoomStatus.ENDED);
                    
                    // Notify remaining player
                    SocketIOClient remainingPlayer = null;
                    if (room.getPlayer1() != null && !room.getPlayer1().getSessionId().equals(room.getDisconnectedPlayerId())) {
                        remainingPlayer = room.getPlayer1();
                    } else if (room.getPlayer2() != null && !room.getPlayer2().getSessionId().equals(room.getDisconnectedPlayerId())) {
                        remainingPlayer = room.getPlayer2();
                    }
                    
                    if (remainingPlayer != null) {
                        remainingPlayer.sendEvent("room_timeout", new RoomMessage(
                            MessageType.SERVER,
                            "Opponent did not reconnect in time. Room closed.",
                            room.getRoomId(),
                            room.getPlayerRole(remainingPlayer),
                            RoomStatus.ENDED
                        ));
                    }
                    
                    log.info("Room {} timed out after {} seconds", room.getRoomId(), elapsedSeconds);
                    cleanupRoom(room.getRoomId());
                    return true;
                }
            }
            return false;
        });
    }

    public boolean isPlayerInRoom(UUID sessionId, String roomId) {
        String playerRoomId = playerToRoom.get(sessionId);
        return roomId.equals(playerRoomId);
    }

    public String getPlayerRoom(UUID sessionId) {
        return playerToRoom.get(sessionId);
    }
}

