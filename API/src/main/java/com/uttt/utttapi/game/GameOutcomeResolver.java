package com.uttt.utttapi.game;

import java.util.List;
import java.util.Optional;

import com.uttt.utttapi.game.state.BoardState;
import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.room.GameResult;

public final class GameOutcomeResolver {

    private static final List<List<Integer>> LINES = List.of(
            List.of(0, 1, 2),
            List.of(3, 4, 5),
            List.of(6, 7, 8),
            List.of(0, 3, 6),
            List.of(1, 4, 7),
            List.of(2, 5, 8),
            List.of(0, 4, 8),
            List.of(2, 4, 6)
    );

    private GameOutcomeResolver() {
    }

    public static Optional<GameResult> resolveOutcome(State state) {
        if (state == null || state.getHistory() == null || state.getHistory().isEmpty()) {
            return Optional.empty();
        }
        BoardState board = state.getHistory().getLast();
        List<String> bigSquares = board.getBigSquares();
        if (bigSquares == null) {
            return Optional.empty();
        }
        String winner = calculateMetaWinner(bigSquares);
        if ("X".equals(winner)) {
            return Optional.of(GameResult.X_WIN);
        }
        if ("O".equals(winner)) {
            return Optional.of(GameResult.O_WIN);
        }
        if (isMetaDraw(bigSquares)) {
            return Optional.of(GameResult.DRAW);
        }
        return Optional.empty();
    }

    private static String calculateMetaWinner(List<String> bigSquares) {
        for (String player : List.of("X", "O")) {
            List<String> fixed = new java.util.ArrayList<>(bigSquares);
            for (int k = 0; k < fixed.size(); k++) {
                if ("/".equals(fixed.get(k))) {
                    fixed.set(k, player);
                }
            }
            for (List<Integer> line : LINES) {
                String a = fixed.get(line.get(0));
                String b = fixed.get(line.get(1));
                String c = fixed.get(line.get(2));
                if (a != null && a.equals(b) && b.equals(c)) {
                    return a;
                }
            }
        }
        return null;
    }

    private static boolean isMetaDraw(List<String> bigSquares) {
        if (calculateMetaWinner(bigSquares) != null) {
            return false;
        }
        return bigSquares.stream().allMatch(cell -> cell != null);
    }
}
