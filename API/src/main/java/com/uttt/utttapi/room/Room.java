package com.uttt.utttapi.room;

import java.time.Instant;
import java.util.UUID;

import com.corundumstudio.socketio.SocketIOClient;
import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.game.state.State;

import lombok.Data;

@Data
public class Room {
    private Long dbId;
    private String roomId;
    private SocketIOClient player1;
    private SocketIOClient player2;
    private UltimateTicTacToe game;
    private RoomStatus status;
    private GameResult gameResult;
    private Instant createdAt;
    private Instant lastActivity;
    private Instant disconnectTime;
    private UUID playerXToken;
    private UUID playerOToken;
    private UUID disconnectedPlayerToken;

    public Room(String roomId) {
        this.roomId = roomId;
        this.status = RoomStatus.WAITING_FOR_PLAYER;
        this.createdAt = Instant.now();
        this.lastActivity = Instant.now();
        this.game = new UltimateTicTacToe();
    }

    public Room(String roomId, Long dbId, State persistedState) {
        this.roomId = roomId;
        this.dbId = dbId;
        this.game = new UltimateTicTacToe(persistedState);
        this.createdAt = Instant.now();
        this.lastActivity = Instant.now();
    }

    public boolean isFull() {
        return player1 != null && player2 != null;
    }

    public String getPlayerRole(SocketIOClient client) {
        if (client == null) {
            return null;
        }
        UUID sessionId = client.getSessionId();
        if (player1 != null && player1.getSessionId().equals(sessionId)) {
            return "X";
        } else if (player2 != null && player2.getSessionId().equals(sessionId)) {
            return "O";
        }
        return null;
    }

    public UUID getPlayerTokenForRole(String role) {
        if ("X".equals(role)) {
            return playerXToken;
        }
        if ("O".equals(role)) {
            return playerOToken;
        }
        return null;
    }

    public String getRoleForToken(UUID token) {
        if (token == null) {
            return null;
        }
        if (token.equals(playerXToken)) {
            return "X";
        }
        if (token.equals(playerOToken)) {
            return "O";
        }
        return null;
    }

    public SocketIOClient getOtherPlayer(SocketIOClient client) {
        if (client == null) {
            return null;
        }
        UUID sessionId = client.getSessionId();
        if (player1 != null && player1.getSessionId().equals(sessionId)) {
            return player2;
        } else if (player2 != null && player2.getSessionId().equals(sessionId)) {
            return player1;
        }
        return null;
    }

    public boolean containsPlayer(SocketIOClient client) {
        if (client == null) {
            return false;
        }
        UUID sessionId = client.getSessionId();
        if (player1 != null && player1.getSessionId().equals(sessionId)) {
            return true;
        }
        if (player2 != null && player2.getSessionId().equals(sessionId)) {
            return true;
        }
        return false;
    }

    public void updateActivity() {
        this.lastActivity = Instant.now();
    }
}
