package com.uttt.utttapi.game.state;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BoardState {
    private List<List<String>> squares;
    private List<String> bigSquares;
    private int availableBoard;
    @JsonProperty("xIsNext")
    private Boolean xIsNext;
}
