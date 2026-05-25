package com.uttt.utttapi.messages.serverMessages;

import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.messages.Message;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
@AllArgsConstructor
public class StateMessage extends Message {
    private State state;
}
