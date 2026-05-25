package com.uttt.utttapi.messages.serverMessages;

import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.MessageType;
import com.uttt.utttapi.room.RoomStatus;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class RoomMessage extends Message {
    private String playerRole; // "X" or "O"
    private RoomStatus roomStatus;
    private String playerToken;

    public RoomMessage() {
        super();
    }

    public RoomMessage(MessageType type, String message, String roomId, String playerRole, RoomStatus roomStatus) {
        this(type, message, roomId, playerRole, roomStatus, null);
    }

    public RoomMessage(MessageType type, String message, String roomId, String playerRole,
            RoomStatus roomStatus, String playerToken) {
        super(type, message);
        this.setRoom(roomId);
        this.playerRole = playerRole;
        this.roomStatus = roomStatus;
        this.playerToken = playerToken;
    }
}


