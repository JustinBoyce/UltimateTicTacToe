package com.uttt.utttapi.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.uttt.utttapi.game.GameOutcomeResolver;
import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.MessageType;
import com.uttt.utttapi.messages.serverMessages.RoomClosedMessage;
import com.uttt.utttapi.messages.serverMessages.RoomMessage;
import com.uttt.utttapi.messages.serverMessages.StateMessage;
import com.uttt.utttapi.persistence.RoomEntity;
import com.uttt.utttapi.persistence.RoomMapper;
import com.uttt.utttapi.persistence.RoomPersistenceService;
import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.room.RoomIdGenerator;
import com.uttt.utttapi.room.RoomStatus;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final Map<UUID, String> playerToRoom = new ConcurrentHashMap<>();
    private final Map<String, Object> roomLocks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private static final long RECONNECTION_TIMEOUT_SECONDS = 60;

    private final SocketIOServer server;
    private final RoomPersistenceService roomPersistenceService;
    private final RoomMapper roomMapper;
    private final RoomIdGenerator roomIdGenerator;

    public RoomService(
            SocketIOServer server,
            RoomPersistenceService roomPersistenceService,
            RoomMapper roomMapper,
            RoomIdGenerator roomIdGenerator) {
        this.server = server;
        this.roomPersistenceService = roomPersistenceService;
        this.roomMapper = roomMapper;
        this.roomIdGenerator = roomIdGenerator;
    }

    @PostConstruct
    public void init() {
        sweepExpiredReconnectsFromDb();
        scheduler.scheduleAtFixedRate(this::checkReconnectionTimeouts, 5, 5, TimeUnit.SECONDS);
    }

    @Transactional
    public Room createRoomAndJoinCreator(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        if (playerToRoom.containsKey(sessionId)) {
            log.warn("Player {} already in room {}", sessionId, playerToRoom.get(sessionId));
            return null;
        }

        String roomId = roomIdGenerator.generateUniqueActiveRoomId();
        UUID playerXToken = UUID.randomUUID();
        RoomEntity entity = roomPersistenceService.insertNewRoom(roomId, playerXToken);
        Room room = roomMapper.toRoom(entity);
        room.setPlayerXToken(playerXToken);
        room.setPlayer1(client);
        playerToRoom.put(sessionId, roomId);
        client.joinRoom(roomId);
        cacheRoom(room);
        log.info("Room {} created; player {} joined as X", roomId, sessionId);
        return room;
    }

    public Room joinRoom(String roomId, SocketIOClient client) {
        if (!RoomIdGenerator.isValidRoomId(roomId)) {
            log.warn("Invalid room id format: {}", roomId);
            return null;
        }

        Room room = getOrLoadActiveRoom(roomId);
        if (room == null) {
            log.warn("Active room {} does not exist", roomId);
            return null;
        }

        if (room.getStatus() == RoomStatus.WAITING_RECONNECT) {
            return handleReconnect(client, roomId, null);
        }

        if (room.isFull()) {
            log.warn("Room {} is already full", roomId);
            return null;
        }

        UUID sessionId = client.getSessionId();
        if (playerToRoom.containsKey(sessionId)) {
            String existingRoomId = playerToRoom.get(sessionId);
            if (!existingRoomId.equals(roomId)) {
                log.warn("Player {} is already in room {}", sessionId, existingRoomId);
                return null;
            }
        }

        if (room.getPlayer2() == null && room.getStatus() == RoomStatus.WAITING_FOR_PLAYER) {
            UUID playerOToken = UUID.randomUUID();
            room.setPlayer2(client);
            room.setPlayerOToken(playerOToken);
            playerToRoom.put(sessionId, roomId);
            client.joinRoom(roomId);
            room.setStatus(RoomStatus.IN_PROGRESS);
            room.updateActivity();
            persistRoom(room);

            State initialState = room.getGame().getState();
            for (SocketIOClient roomClient : server.getRoomOperations(roomId).getClients()) {
                String role = room.getPlayerRole(roomClient);
                roomClient.sendEvent("game_started", roomMessage(
                        "Game started", roomId, role, RoomStatus.IN_PROGRESS, room));
                roomClient.sendEvent("state_update", new StateMessage(initialState));
            }
            log.info("Player {} joined room {} as O", sessionId, roomId);
        }

        return room;
    }

    public Room getRoom(String roomId) {
        Room cached = rooms.get(roomId);
        if (cached != null) {
            return cached;
        }
        return getOrLoadActiveRoom(roomId);
    }

    public UltimateTicTacToe getGame(String roomId) {
        Room room = getRoom(roomId);
        return room != null ? room.getGame() : null;
    }

    public void saveRoom(Room room) {
        if (room == null || room.getDbId() == null) {
            return;
        }
        GameOutcomeResolver.resolveOutcome(room.getGame().getState()).ifPresent(outcome -> {
            room.setGameResult(outcome);
            room.setStatus(RoomStatus.ENDED);
        });
        room.updateActivity();
        Room updated = roomPersistenceService.saveRoom(room);
        room.setGameResult(updated.getGameResult());
        room.setStatus(updated.getStatus());
        cacheRoom(room);
    }

    public void resetGameState(Room room) {
        room.setGame(new UltimateTicTacToe());
        room.setGameResult(null);
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.updateActivity();
        persistRoom(room);
    }

    public void handleDisconnect(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        String roomId = playerToRoom.get(sessionId);
        if (roomId == null) {
            roomId = findRoomIdByPlayerSession(sessionId);
        }
        if (roomId == null) {
            log.info("Client {} disconnected but was not in any room", sessionId);
            return;
        }

        Room room = getOrLoadActiveRoom(roomId);
        if (room == null) {
            playerToRoom.remove(sessionId);
            return;
        }

        if (room.getStatus() == RoomStatus.WAITING_RECONNECT) {
            SocketIOClient connected = getConnectedPlayerByDisconnectedToken(room);
            if (connected != null && connected.getSessionId().equals(sessionId)) {
                softCloseRoom(room, GameResult.CANCELLED);
                notifyRoomClosed(room, client, "opponent_left");
                log.info("Connected player left during reconnect wait; room {} closed", roomId);
                return;
            }
            playerToRoom.remove(sessionId);
            log.info("Ignoring duplicate disconnect in room {}", roomId);
            return;
        }

        if (room.getStatus() != RoomStatus.IN_PROGRESS) {
            softCloseRoom(room, GameResult.CANCELLED);
            return;
        }

        UUID disconnectedToken = null;
        if (room.getPlayer1() != null && room.getPlayer1().getSessionId().equals(sessionId)) {
            disconnectedToken = room.getPlayerXToken();
        } else if (room.getPlayer2() != null && room.getPlayer2().getSessionId().equals(sessionId)) {
            disconnectedToken = room.getPlayerOToken();
        } else {
            playerToRoom.remove(sessionId);
            return;
        }

        playerToRoom.remove(sessionId);
        room.setDisconnectedPlayerToken(disconnectedToken);
        room.setStatus(RoomStatus.WAITING_RECONNECT);
        room.setDisconnectTime(Instant.now());
        persistRoom(room);

        SocketIOClient otherPlayer = getConnectedPlayer(room, sessionId);
        if (otherPlayer != null) {
            otherPlayer.sendEvent("player_disconnected", roomMessage(
                    "Player disconnected. Waiting for reconnection...",
                    roomId,
                    room.getPlayerRole(otherPlayer),
                    RoomStatus.WAITING_RECONNECT,
                    room));
        }
        log.info("Player {} disconnected from room {}", sessionId, roomId);
    }

    public Room handleReconnect(SocketIOClient client, String roomId, String playerToken) {
        if (!RoomIdGenerator.isValidRoomId(roomId)) {
            return null;
        }

        if (playerToken == null || playerToken.isBlank()) {
            log.warn("Reconnect to room {} without playerToken", roomId);
            return null;
        }

        UUID token;
        try {
            token = UUID.fromString(playerToken);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid playerToken for room {}", roomId);
            return null;
        }

        Object lock = roomLocks.computeIfAbsent(roomId, id -> new Object());
        synchronized (lock) {
            Room room = getOrLoadActiveRoom(roomId);
            if (room == null) {
                return null;
            }

            String role = room.getRoleForToken(token);
            if (role == null) {
                log.warn("Token does not match any seat in room {}", roomId);
                return null;
            }

            if (room.getStatus() == RoomStatus.WAITING_RECONNECT) {
                if (!token.equals(room.getDisconnectedPlayerToken())) {
                    log.warn("Token is not the disconnected player for room {}", roomId);
                    return null;
                }
                return bindPlayerAndFinalizeReconnect(client, room, roomId, role);
            }

            if (room.getStatus() == RoomStatus.IN_PROGRESS || room.getStatus() == RoomStatus.ENDED) {
                return tryReconnectToOpenSlot(client, room, roomId, role);
            }

            log.warn("Room {} not accepting reconnect (status: {})", roomId, room.getStatus());
            return null;
        }
    }

    public boolean isSessionInRoom(String roomId, UUID sessionId) {
        return roomId != null && roomId.equals(playerToRoom.get(sessionId));
    }

    public void leaveRoom(SocketIOClient client) {
        UUID sessionId = client.getSessionId();
        String roomId = playerToRoom.get(sessionId);
        if (roomId == null) {
            client.sendEvent("error", new Message(MessageType.SERVER, "Not in a room"));
            return;
        }

        Room room = getOrLoadActiveRoom(roomId);
        if (room == null || !room.containsPlayer(client)) {
            playerToRoom.remove(sessionId);
            client.sendEvent("error", new Message(MessageType.SERVER, "Room not found"));
            return;
        }

        GameResult result = room.getGameResult() != null ? room.getGameResult() : GameResult.CANCELLED;
        SocketIOClient other = room.getOtherPlayer(client);
        if (other != null) {
            other.sendEvent("room_closed", new RoomClosedMessage(
                    MessageType.SERVER, "Opponent left. Room closed.", roomId, "opponent_left"));
        }
        client.sendEvent("room_closed", new RoomClosedMessage(
                MessageType.SERVER, "You left the room.", roomId, "self_left"));
        softCloseRoom(room, result);
        log.info("Client {} left room {}", sessionId, roomId);
    }

    public void cleanupRoom(String roomId) {
        Room room = rooms.remove(roomId);
        if (room != null) {
            detachSockets(room, roomId);
        }
    }

    private void softCloseRoom(Room room, GameResult gameResult) {
        String roomId = room.getRoomId();
        roomPersistenceService.softClose(room, gameResult);
        cleanupRoom(roomId);
        log.info("Room {} soft-closed with result {}", roomId, gameResult);
    }

    private void checkReconnectionTimeouts() {
        Instant now = Instant.now();
        for (Room room : rooms.values().toArray(new Room[0])) {
            if (room.getStatus() == RoomStatus.WAITING_RECONNECT && room.getDisconnectTime() != null) {
                long elapsed = now.getEpochSecond() - room.getDisconnectTime().getEpochSecond();
                if (elapsed >= RECONNECTION_TIMEOUT_SECONDS) {
                    SocketIOClient remaining = getConnectedPlayerByDisconnectedToken(room);
                    if (remaining != null) {
                        remaining.sendEvent("room_timeout", roomMessage(
                                "Opponent did not reconnect in time. Room closed.",
                                room.getRoomId(),
                                room.getPlayerRole(remaining),
                                RoomStatus.ENDED,
                                room));
                    }
                    softCloseRoom(room, GameResult.RECONNECT_TIMEOUT);
                }
            }
        }
        sweepExpiredReconnectsFromDb();
    }

    private void sweepExpiredReconnectsFromDb() {
        var expired = roomPersistenceService.findAndSoftCloseExpiredReconnects();
        for (RoomEntity entity : expired) {
            rooms.remove(entity.getRoomId());
            log.info("DB sweep soft-closed room {} (reconnect timeout)", entity.getRoomId());
        }
    }

    private Room getOrLoadActiveRoom(String roomId) {
        Room cached = rooms.get(roomId);
        if (cached != null) {
            return cached;
        }
        return roomPersistenceService.findActiveByRoomId(roomId)
                .map(room -> {
                    cacheRoom(room);
                    return room;
                })
                .orElse(null);
    }

    private void cacheRoom(Room room) {
        rooms.put(room.getRoomId(), room);
    }

    private void persistRoom(Room room) {
        Room updated = roomPersistenceService.saveRoom(room);
        room.setGameResult(updated.getGameResult());
        room.setStatus(updated.getStatus());
        cacheRoom(room);
    }

    private void persistRoomSafely(Room room, String context) {
        try {
            persistRoom(room);
        } catch (Exception ex) {
            log.error("Failed to persist room {} ({}); in-memory session bindings retained",
                    room.getRoomId(), context, ex);
        }
    }

    private Room bindPlayerAndFinalizeReconnect(SocketIOClient client, Room room, String roomId, String role) {
        if ("X".equals(role)) {
            if (room.getPlayer1() != null
                    && !room.getPlayer1().getSessionId().equals(client.getSessionId())) {
                playerToRoom.remove(room.getPlayer1().getSessionId());
            }
            room.setPlayer1(client);
        } else {
            if (room.getPlayer2() != null
                    && !room.getPlayer2().getSessionId().equals(client.getSessionId())) {
                playerToRoom.remove(room.getPlayer2().getSessionId());
            }
            room.setPlayer2(client);
        }
        return finalizeReconnect(client, room, roomId);
    }

    private Room tryReconnectToOpenSlot(SocketIOClient client, Room room, String roomId, String role) {
        if (room.containsPlayer(client)) {
            return room;
        }
        boolean slotOpen = "X".equals(role)
                ? (room.getPlayer1() == null || !room.getPlayer1().isChannelOpen())
                : (room.getPlayer2() == null || !room.getPlayer2().isChannelOpen());
        if (!slotOpen) {
            log.warn("Seat {} is not open for reconnect in room {}", role, roomId);
            return null;
        }
        return bindPlayerAndFinalizeReconnect(client, room, roomId, role);
    }

    private Room finalizeReconnect(SocketIOClient client, Room room, String roomId) {
        UUID sessionId = client.getSessionId();
        playerToRoom.put(sessionId, roomId);
        client.joinRoom(roomId);
        room.setDisconnectedPlayerToken(null);
        room.setDisconnectTime(null);
        if (room.getGameResult() == null) {
            room.setStatus(RoomStatus.IN_PROGRESS);
        }
        room.updateActivity();
        persistRoomSafely(room, "reconnect");

        State currentState = room.getGame().getState();
        for (SocketIOClient roomClient : server.getRoomOperations(roomId).getClients()) {
            String role = room.getPlayerRole(roomClient);
            roomClient.sendEvent("player_reconnected", roomMessage(
                    "Player reconnected. Game resumed.",
                    roomId,
                    role,
                    RoomStatus.IN_PROGRESS,
                    room));
            roomClient.sendEvent("state_update", new StateMessage(currentState));
        }
        log.info("Player {} reconnected to room {}", sessionId, roomId);
        return room;
    }

    private RoomMessage roomMessage(String message, String roomId, String role,
            RoomStatus status, Room room) {
        String token = role != null ? stringifyToken(room.getPlayerTokenForRole(role)) : null;
        return new RoomMessage(MessageType.SERVER, message, roomId, role, status, token);
    }

    private static String stringifyToken(UUID token) {
        return token != null ? token.toString() : null;
    }

    private SocketIOClient getConnectedPlayer(Room room, UUID disconnectedSessionId) {
        if (room.getPlayer1() != null && !room.getPlayer1().getSessionId().equals(disconnectedSessionId)) {
            return room.getPlayer1();
        }
        if (room.getPlayer2() != null && !room.getPlayer2().getSessionId().equals(disconnectedSessionId)) {
            return room.getPlayer2();
        }
        return null;
    }

    private SocketIOClient getConnectedPlayerByDisconnectedToken(Room room) {
        UUID disconnected = room.getDisconnectedPlayerToken();
        if (disconnected == null) {
            return null;
        }
        if (disconnected.equals(room.getPlayerXToken()) && room.getPlayer1() != null) {
            return room.getPlayer1();
        }
        if (disconnected.equals(room.getPlayerOToken()) && room.getPlayer2() != null) {
            return room.getPlayer2();
        }
        return null;
    }

    private void detachSockets(Room room, String roomId) {
        if (room.getPlayer1() != null) {
            room.getPlayer1().leaveRoom(roomId);
            playerToRoom.remove(room.getPlayer1().getSessionId());
        }
        if (room.getPlayer2() != null) {
            room.getPlayer2().leaveRoom(roomId);
            playerToRoom.remove(room.getPlayer2().getSessionId());
        }
    }

    private void notifyRoomClosed(Room room, SocketIOClient leaver, String reason) {
        String roomId = room.getRoomId();
        SocketIOClient other = room.getOtherPlayer(leaver);
        if (other != null) {
            other.sendEvent("room_closed", new RoomClosedMessage(
                    MessageType.SERVER, "Opponent left. Room closed.", roomId, reason));
        }
        leaver.sendEvent("room_closed", new RoomClosedMessage(
                MessageType.SERVER, "You left the room.", roomId, "self_left"));
    }

    private String findRoomIdByPlayerSession(UUID sessionId) {
        for (Map.Entry<String, Room> entry : rooms.entrySet()) {
            Room room = entry.getValue();
            if (room.getPlayer1() != null && room.getPlayer1().getSessionId().equals(sessionId)) {
                return entry.getKey();
            }
            if (room.getPlayer2() != null && room.getPlayer2().getSessionId().equals(sessionId)) {
                return entry.getKey();
            }
        }
        return null;
    }

}
