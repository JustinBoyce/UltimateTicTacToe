package com.uttt.utttapi;

import org.springframework.stereotype.Component;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.MessageType;
import com.uttt.utttapi.messages.clientMessages.MoveMade;
import com.uttt.utttapi.messages.serverMessages.RoomMessage;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.service.RoomService;
import com.uttt.utttapi.service.SocketService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SocketListener {

    private final SocketIOServer server;

    private final SocketService socketService;
    private final RoomService roomService;

    public SocketListener(SocketIOServer server, SocketService socketService, RoomService roomService) {
        this.server = server;
        this.socketService = socketService;
        this.roomService = roomService;
        this.server.addConnectListener(onConnected());
        this.server.addDisconnectListener(onDisconnected());
        this.server.addEventListener("create_room", Message.class, onCreateRoom());
        this.server.addEventListener("join_room", Message.class, onJoinRoom());
        this.server.addEventListener("reconnect_to_room", Message.class, onReconnectToRoom());
        this.server.addEventListener("send_message", Message.class, onChatReceived());
        this.server.addEventListener("move_made", MoveMade.class, onMoveMade());
        this.server.addEventListener("reset_board", Message.class, onResetBoard());
        this.server.addEventListener("set_almost_won", Message.class, onSetAlmostWon());
        this.server.addEventListener("leave_room", Message.class, onLeaveRoom());
    }

    private DataListener<Message> onChatReceived() {
        return (senderClient, data, ackSender) -> {
            log.info(data.toString());
            socketService.sendMessage(data.getRoom(), "get_message", senderClient, data.getMessage());
        };
    }

    private DataListener<MoveMade> onMoveMade() {
        return (senderClient, data, ackSender) -> {
            log.info(data.toString());
            socketService.moveMade(data.getRoom(), "move_made", senderClient, data.getI(), data.getJ());
        };
    }

    private DataListener<Message> onResetBoard() {
        return (senderClient, data, ackSender) -> {
            log.info("Reset board requested: " + data.toString());
            socketService.resetBoard(data.getRoom(), "reset_board", senderClient);
        };
    }

    private DataListener<Message> onSetAlmostWon() {
        return (senderClient, data, ackSender) -> {
            log.info("Set almost won requested: " + data.toString());
            socketService.setAlmostWon(data.getRoom(), senderClient);
        };
    }

    private DataListener<Message> onLeaveRoom() {
        return (senderClient, data, ackSender) -> {
            log.info("leave_room: {}", data);
            roomService.leaveRoom(senderClient);
        };
    }

    private DataListener<Message> onCreateRoom() {
        return (senderClient, data, ackSender) -> {
            if (data.getRoom() != null && !data.getRoom().isBlank()) {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is assigned by the server"));
                return;
            }

            Room room = roomService.createRoomAndJoinCreator(senderClient);
            if (room != null) {
                String role = room.getPlayerRole(senderClient);
                String token = room.getPlayerXToken() != null ? room.getPlayerXToken().toString() : null;
                senderClient.sendEvent("player_joined", new RoomMessage(
                        MessageType.SERVER,
                        "Room created and joined successfully",
                        room.getRoomId(),
                        role,
                        room.getStatus(),
                        token));
                log.info("Room {} created by client {}", room.getRoomId(), senderClient.getSessionId());
            } else {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Failed to create room"));
            }
        };
    }

    private DataListener<Message> onJoinRoom() {
        return (senderClient, data, ackSender) -> {
            String roomId = data.getRoom();
            if (roomId == null || roomId.isEmpty()) {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is required"));
                return;
            }

            Room room = roomService.joinRoom(roomId.trim().toUpperCase(), senderClient);
            if (room != null) {
                String role = room.getPlayerRole(senderClient);
                String token = room.getPlayerTokenForRole(role) != null
                        ? room.getPlayerTokenForRole(role).toString()
                        : null;
                senderClient.sendEvent("player_joined", new RoomMessage(
                        MessageType.SERVER,
                        "Joined room successfully",
                        roomId,
                        role,
                        room.getStatus(),
                        token));
                log.info("Client {} joined room {} as {}", senderClient.getSessionId(), roomId, role);
            } else {
                senderClient.sendEvent("error", new Message(MessageType.SERVER,
                        "Failed to join room. Room may not exist or be full."));
            }
        };
    }

    private DataListener<Message> onReconnectToRoom() {
        return (senderClient, data, ackSender) -> {
            String roomId = data.getRoom();
            if (roomId == null || roomId.isEmpty()) {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is required"));
                return;
            }

            Room room = roomService.handleReconnect(senderClient, roomId.trim().toUpperCase(), data.getPlayerToken());
            if (room == null) {
                senderClient.sendEvent("error", new Message(MessageType.SERVER,
                        "Failed to reconnect. Room may not exist or token is invalid."));
            } else {
                log.info("Client {} reconnected to room {}", senderClient.getSessionId(), roomId);
            }
        };
    }

    private ConnectListener onConnected() {
        return (client) -> log.info("Socket ID[{}] Connected to socket", client.getSessionId().toString());
    }

    private DisconnectListener onDisconnected() {
        return client -> {
            log.info("Client[{}] - Disconnected from socket", client.getSessionId().toString());
            roomService.handleDisconnect(client);
        };
    }
}
