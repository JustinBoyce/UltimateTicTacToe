package com.uttt.utttapi.service;

import org.springframework.stereotype.Service;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.game.state.BoardState;
import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.MessageType;
import com.uttt.utttapi.messages.serverMessages.StateMessage;
import com.uttt.utttapi.room.Room;

import lombok.extern.slf4j.Slf4j;

// TODO: Refactor SocketService and SocketListener to have distinct purposes
@Service
@Slf4j
public class SocketService {

    private final RoomService roomService;
    private final SocketIOServer server;

    public SocketService(RoomService roomService, SocketIOServer server) {
        this.roomService = roomService;
        this.server = server;
    }

    public void sendMessage(String room, String eventName, SocketIOClient senderClient, String message) {
        for (SocketIOClient client : senderClient.getNamespace().getRoomOperations(room).getClients()) {
            log.info("client rooms: " + client.getAllRooms());
            log.info("client sessionId: " + client.getSessionId());
            log.info("message: " + message);
            if (!client.getSessionId().equals(senderClient.getSessionId())) {
                client.sendEvent(eventName,
                new Message(MessageType.SERVER, message));
            }
        }
    }

    public void moveMade(String room, String eventName, SocketIOClient senderClient, int i, int j) {
        log.info("Move made: {} {} in room {}", i, j, room);
        
        // Validate room exists
        Room roomObj = roomService.getRoom(room);
        if (roomObj == null) {
            log.warn("Room {} does not exist", room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room does not exist"));
            return;
        }

        // Validate player is in room
        if (!roomObj.containsPlayer(senderClient)) {
            log.warn("Player {} is not in room {}", senderClient.getSessionId(), room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "You are not in this room"));
            return;
        }

        // Validate room is in progress
        if (roomObj.getStatus() != com.uttt.utttapi.room.RoomStatus.IN_PROGRESS) {
            log.warn("Room {} is not in progress. Status: {}", room, roomObj.getStatus());
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Game is not in progress"));
            return;
        }

        // Validate it's the player's turn
        UltimateTicTacToe game = roomService.getGame(room);
        if (game == null) {
            log.error("Game instance not found for room {}", room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Game instance not found"));
            return;
        }

        State currentState = game.getState();
        BoardState currentBoardState = currentState.getHistory().getLast();
        String playerRole = roomObj.getPlayerRole(senderClient);
        boolean isPlayerX = "X".equals(playerRole);
        
        // Check if it's the correct player's turn
        if (currentBoardState.getXIsNext() != isPlayerX) {
            log.warn("Not {}'s turn in room {}", playerRole, room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Not your turn"));
            return;
        }

        // Call game logic
        State returnState = game.makeMove(i, j);
        if (returnState == null) {
            log.warn("Invalid move: {} {} in room {}", i, j, room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Invalid move"));
            return;
        }
        
        log.info("Move successful. New state: {}", returnState.toString());
        roomObj.updateActivity();
        
        // Send updates to every client in the room
        for (SocketIOClient client : server.getRoomOperations(room).getClients()) {
            client.sendEvent("state_update", new StateMessage(returnState));
        }
    }

    public void resetBoard(String room, String eventName, SocketIOClient senderClient) {
        log.info("Resetting board in room {}", room);
        
        // Validate room exists
        Room roomObj = roomService.getRoom(room);
        if (roomObj == null) {
            log.warn("Room {} does not exist", room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room does not exist"));
            return;
        }

        // Validate player is in room
        if (!roomObj.containsPlayer(senderClient)) {
            log.warn("Player {} is not in room {}", senderClient.getSessionId(), room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "You are not in this room"));
            return;
        }

        // Create new game instance for this room
        roomObj.setGame(new UltimateTicTacToe());
        // Get initial state
        State initialState = roomObj.getGame().getState();
        log.info("Board reset. Initial state: {}", initialState.toString());
        roomObj.updateActivity();
        
        // Send updates to every client in the room
        for (SocketIOClient client : server.getRoomOperations(room).getClients()) {
            client.sendEvent("state_update", new StateMessage(initialState));
        }
    }

    public void setAlmostWon(String room, SocketIOClient senderClient) {
        log.info("Setting almost won test state in room {}", room);

        Room roomObj = roomService.getRoom(room);
        if (roomObj == null) {
            log.warn("Room {} does not exist", room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Room does not exist"));
            return;
        }

        if (!roomObj.containsPlayer(senderClient)) {
            log.warn("Player {} is not in room {}", senderClient.getSessionId(), room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "You are not in this room"));
            return;
        }

        if (roomObj.getStatus() != com.uttt.utttapi.room.RoomStatus.IN_PROGRESS) {
            log.warn("Room {} is not in progress. Status: {}", room, roomObj.getStatus());
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Game is not in progress"));
            return;
        }

        UltimateTicTacToe game = roomObj.getGame();
        if (game == null) {
            log.error("Game instance not found for room {}", room);
            senderClient.sendEvent("error", new Message(MessageType.SERVER, "Game instance not found"));
            return;
        }

        State nearWinState = game.setAlmostWonTestState();
        roomObj.updateActivity();

        for (SocketIOClient client : server.getRoomOperations(room).getClients()) {
            client.sendEvent("state_update", new StateMessage(nearWinState));
        }
    }

}