package com.uttt.utttapi.game;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.uttt.utttapi.game.state.*;;

public class UltimateTicTacToe {
    State state;

    public UltimateTicTacToe() {
        this.state = new State();
        this.state.setHistory(initialBoard());
    }

    public State getState() {
        return this.state;
    }

    public State setAlmostWonTestState() {
        BoardState presetState = new BoardState();
        presetState.setSquares(buildAlmostWonSquares());
        presetState.setBigSquares(new ArrayList<>(Arrays.asList(null, null, null, "X", null, "O", "X", null, "O")));
        presetState.setAvailableBoard(4);
        presetState.setXIsNext(false);
        this.state.setHistory(new ArrayList<>(List.of(presetState)));
        return this.state;
    }

    // TODO: Need to be able to confirm if the move is legal
    // Index: left -> right, top -> bottom
    public State makeMove(int squareIndex, int boardIndex) {
        BoardState currentBoardState = this.state.getHistory().getLast();

        // Check if the move was valid and just return the current board state if not
        if(currentBoardState.getAvailableBoard() != 4 && currentBoardState.getAvailableBoard() != boardIndex) {
            return this.state;
        }

        // use stream to create a mutable copy of the list
        List<List<String>> newSquares = currentBoardState.getSquares().stream()
            .map(squares -> {
                    List<String> squaresCopy = new ArrayList<>(squares);
                    return squaresCopy;
                }
            )
            .toList();
        List<String> newBigSquares = new ArrayList<>(currentBoardState.getBigSquares());
        // Available board for the next move is based on the square clicked on the previous move except when a board is won or a center square is clicked
        // board 4 (the center of the 3x3 grid) indicates that any board is allowed to be played
        int newAvailableBoard = squareIndex;

        // Check if the move being made is legal: If board 4 is available then all boards are available, otherwise only the available boards are available
        // bigSquares is equivalent to board in this context
        boolean bigSquareInactive = !(currentBoardState.getAvailableBoard() == 4) && !(currentBoardState.getAvailableBoard()  == boardIndex);

        if (newBigSquares.get(boardIndex) != null || calculateWinner(newBigSquares) != null || newSquares.get(boardIndex).get(squareIndex) != null || bigSquareInactive) {
            return null;
        }
        
        //Set square as clicked
        String currPlayer = currentPlayer();
        newSquares.get(boardIndex).set(squareIndex, currPlayer);

        if(calculateWinner(newSquares.get(boardIndex)) != null) {
            newBigSquares.set(boardIndex, currentPlayer());
            newAvailableBoard = 4;
        } 
        else if (isTied(newSquares.get(boardIndex))) {
            newBigSquares.set(boardIndex, "/");
        } 
        
        // If board corresponding to boardIndex has been completed, then player can play anywhere
        if(newBigSquares.get(squareIndex) != null) {
            newAvailableBoard = 4;
        }

        // Update xIsNext for the next turn
        Boolean nextXIsNext = !currentBoardState.getXIsNext();

        this.state.getHistory()
            .add(new BoardState(newSquares, newBigSquares, newAvailableBoard, nextXIsNext));
        // TODO: Test the game logic 
        // Refactor: Be less reliant on nulls
        return this.state;

    }

    private List<BoardState> initialBoard() {
        List<BoardState> initialHistory = new ArrayList<>();
        BoardState initialState = new BoardState();
        initialState.setAvailableBoard(4);
        initialState.setBigSquares(new ArrayList<>(Collections.nCopies(9, null)));
        initialState.setSquares(new ArrayList<>(Collections.nCopies(9, (Collections.nCopies(9, null)))));
        initialState.setXIsNext(true);
        initialHistory.add(initialState);
        return initialHistory;
    }

    private List<List<String>> buildAlmostWonSquares() {
        List<List<String>> squares = new ArrayList<>();
        squares.add(new ArrayList<>(Arrays.asList("X", null, null, null, "X", null, null, null, null)));
        squares.add(new ArrayList<>(Collections.nCopies(9, null)));
        squares.add(new ArrayList<>(Arrays.asList(null, null, null, null, "O", null, "O", null, null)));
        squares.add(new ArrayList<>(Arrays.asList(null, null, null, "X", "X", "X", null, null, null)));
        squares.add(new ArrayList<>(Collections.nCopies(9, null)));
        squares.add(new ArrayList<>(Arrays.asList(null, null, null, "O", "O", "O", null, null, null)));
        squares.add(new ArrayList<>(Arrays.asList(null, null, "X", null, "X", null, "X", null, null)));
        squares.add(new ArrayList<>(Collections.nCopies(9, null)));
        squares.add(new ArrayList<>(Arrays.asList("O", null, null, null, "O", null, null, null, "O")));
        return squares;
    }

    // Passes in a list of squares and returns the string "X" or "O" if there is a winner and null if there is no winner
    private String calculateWinner(List<String> squares) {
        List<List<Integer>> lines = List.of(
            List.of(0, 1, 2),
            List.of(3, 4, 5),
            List.of(6, 7, 8),
            List.of(0, 3, 6),
            List.of(1, 4, 7),
            List.of(2, 5, 8),
            List.of(0, 4, 8),
            List.of(2, 4, 6)
        );

        for(String player: List.of("X", "O")) {
            List<String> fixedSquares = squares.stream().toList();

            // Tied bigSquares work for both players
            for(int k = 0; k < fixedSquares.size(); k++) {
                if(fixedSquares.get(k) != null && fixedSquares.get(k).equals("/"))
                    fixedSquares.set(k, player);
            }

            // Check all lines to see if there is a winner            
            for(List<Integer> line: lines) {
                String firstSquare = fixedSquares.get(line.get(0));
                String secondSquare = fixedSquares.get(line.get(1));
                String thirdSquare = fixedSquares.get(line.get(2));

                if(firstSquare != null && firstSquare.equals(secondSquare) && secondSquare.equals(thirdSquare)) {
                    return firstSquare;
                }
                
            }
        }
        return null;
    }

    private String currentPlayer() {
        BoardState currentBoardState = this.state.getHistory().getLast();
        return currentBoardState.getXIsNext() ? "X" : "O";
    }

    
    // Takes in a list of squares and returns true if there is a tie and false if there is not
    private boolean isTied(List<String> squares) {
        for (String square : squares) {
            if (square == null) {
                return false;
            }
        }
        return true;
    }
}
