package com.uttt.utttapi.game.state;

import java.util.List;

import lombok.Data;
import lombok.Setter;

@Data
@Setter
public class State {
    private List<BoardState> history;
    
}
