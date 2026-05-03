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
    }

    private DataListener<Message> onChatReceived() {
        return (senderClient, data, ackSender) -> {
            log.info(data.toString());
            socketService.sendMessage(data.getRoom(),"get_message", senderClient, data.getMessage()); //TODO: Does this room actually matter or does the query param determine the room
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

    private DataListener<Message> onCreateRoom() {
        return (senderClient, data, ackSender) -> {
            String roomId = data.getRoom();
            if (roomId == null || roomId.isEmpty()) {
                log.warn("Create room request with null or empty room ID");
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is required"));
                return;
            }
            
            Room room = roomService.createRoom(roomId);
            if (room != null) {
                // Automatically add the creator as player 1 (X)
                Room joinedRoom = roomService.joinRoom(roomId, senderClient);
                if (joinedRoom != null) {
                    String role = joinedRoom.getPlayerRole(senderClient);
                    senderClient.sendEvent("player_joined", new RoomMessage(
                        MessageType.SERVER,
                        "Room created and joined successfully",
                        roomId,
                        role,
                        joinedRoom.getStatus()
                    ));
                    log.info("Room {} created by client {} and added as player 1 (X)", roomId, senderClient.getSessionId());
                } else {
                    // This shouldn't happen, but handle it just in case
                    senderClient.sendEvent("error", new Message(MessageType.SERVER, "Failed to join created room"));
                    log.error("Failed to join room {} after creation", roomId);
                }
            } else {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room already exists"));
                log.warn("Failed to create room {} - already exists", roomId);
            }
        };
    }

    private DataListener<Message> onJoinRoom() {
        return (senderClient, data, ackSender) -> {
            String roomId = data.getRoom();
            if (roomId == null || roomId.isEmpty()) {
                log.warn("Join room request with null or empty room ID");
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is required"));
                return;
            }
            
            Room room = roomService.joinRoom(roomId, senderClient);
            if (room != null) {
                String role = room.getPlayerRole(senderClient);
                senderClient.sendEvent("player_joined", new RoomMessage(
                    MessageType.SERVER,
                    "Joined room successfully",
                    roomId,
                    role,
                    room.getStatus()
                ));
                log.info("Client {} joined room {} as {}", senderClient.getSessionId(), roomId, role);
            } else {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Failed to join room. Room may not exist or be full."));
                log.warn("Failed to join room {} for client {}", roomId, senderClient.getSessionId());
            }
        };
    }

    private DataListener<Message> onReconnectToRoom() {
        return (senderClient, data, ackSender) -> {
            String roomId = data.getRoom();
            if (roomId == null || roomId.isEmpty()) {
                log.warn("Reconnect request with null or empty room ID");
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room ID is required"));
                return;
            }
            
            Room room = roomService.handleReconnect(senderClient, roomId);
            if (room != null) {
                log.info("Client {} reconnected to room {}", senderClient.getSessionId(), roomId);
            } else {
                senderClient.sendEvent("error", new Message(MessageType.SERVER, "Failed to reconnect. Room may not exist or you are not the disconnected player."));
                log.warn("Failed to reconnect client {} to room {}", senderClient.getSessionId(), roomId);
            }
        };
    }

    private ConnectListener onConnected() {
        return (client) -> {
            log.info("Socket ID[{}] Connected to socket", client.getSessionId().toString());
            // Don't auto-join room - wait for explicit join_room event
        };
    }

    private DisconnectListener onDisconnected() {
        return client -> {
            log.info("Client[{}] - Disconnected from socket", client.getSessionId().toString());
            roomService.handleDisconnect(client);
        };
    }

}