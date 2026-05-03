package com.uttt.utttapi.room;

import java.time.Instant;
import java.util.UUID;

import com.corundumstudio.socketio.SocketIOClient;
import com.uttt.utttapi.game.UltimateTicTacToe;

import lombok.Data;

@Data
public class Room {
    private String roomId;
    private SocketIOClient player1;
    private SocketIOClient player2;
    private UltimateTicTacToe game;
    private RoomStatus status;
    private Instant createdAt;
    private Instant lastActivity;
    private Instant disconnectTime; // When a player disconnected (for timeout)
    private UUID disconnectedPlayerId; // Which player disconnected

    public Room(String roomId) {
        this.roomId = roomId;
        this.status = RoomStatus.WAITING_FOR_PLAYER;
        this.createdAt = Instant.now();
        this.lastActivity = Instant.now();
        this.game = new UltimateTicTacToe();
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
        return (player1 != null && player1.getSessionId().equals(sessionId)) ||
               (player2 != null && player2.getSessionId().equals(sessionId));
    }

    public void updateActivity() {
        this.lastActivity = Instant.now();
    }
}

