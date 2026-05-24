package com.uttt.utttapi.messages;

import lombok.Data;

@Data
public class Message {
    // TODO: We should probably refactor to remove the redundancy from MessageType and message fields
    private MessageType type;
    private String message;
    private String room;
    private String playerToken;

    public Message() {
    }

    public Message(MessageType type, String message) {
        this.type = type;
        this.message = message;
    }
}
