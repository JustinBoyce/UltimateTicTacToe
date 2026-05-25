package com.uttt.utttapi.room;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Player {
    private UUID sessionId;
    private String roomId;
    private String role; // "X" or "O"
    private boolean connected;
}


