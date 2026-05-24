package com.uttt.utttapi.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.uttt.utttapi.game.state.BoardState;
import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.room.GameResult;

class GameOutcomeResolverTest {

    @Test
    void detectsXWinOnMetaBoard() {
        State state = stateWithBigSquares("X", "X", "X", null, null, null, null, null, null);
        assertEquals(java.util.Optional.of(GameResult.X_WIN), GameOutcomeResolver.resolveOutcome(state));
    }

    @Test
    void detectsDrawWhenAllBigSquaresFilled() {
        State state = stateWithBigSquares("X", "O", "X", "O", "X", "O", "O", "X", "O");
        assertEquals(java.util.Optional.of(GameResult.DRAW), GameOutcomeResolver.resolveOutcome(state));
    }

    private static State stateWithBigSquares(String... cells) {
        BoardState board = new BoardState();
        board.setBigSquares(new ArrayList<>(Arrays.asList(cells)));
        board.setSquares(new ArrayList<>());
        board.setAvailableBoard(4);
        board.setXIsNext(true);
        State state = new State();
        state.setHistory(new ArrayList<>(List.of(board)));
        return state;
    }
}
