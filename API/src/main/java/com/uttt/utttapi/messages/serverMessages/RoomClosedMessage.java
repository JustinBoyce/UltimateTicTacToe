package com.uttt.utttapi.messages.serverMessages;

import com.uttt.utttapi.messages.Message;
import com.uttt.utttapi.messages.MessageType;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class RoomClosedMessage extends Message {
    /** "opponent_left" | "self_left" */
    private String reason;

    public RoomClosedMessage() {
        super();
    }

    public RoomClosedMessage(MessageType type, String message, String roomId, String reason) {
        super(type, message);
        this.setRoom(roomId);
        this.reason = reason;
    }
}
