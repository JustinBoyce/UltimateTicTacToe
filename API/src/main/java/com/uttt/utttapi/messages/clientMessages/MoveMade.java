package com.uttt.utttapi.messages.clientMessages;

import com.uttt.utttapi.messages.Message;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class MoveMade extends Message {
    private int i;
    private int j;
}
