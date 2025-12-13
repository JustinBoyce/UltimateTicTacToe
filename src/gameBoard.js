import Board from './board.js';
import React from 'react';
import socket from './service/socket.js';

// This component manages displaying the full game board and handles moves being made
// TODO: Prevent players from playing a move when it is not their turn
// TODO: Precent players from playing a move when they are viewing a previous step in the history
function GameBoard({ current, xIsNext }) {

    // Handle button clicks: i is the index of the square, j is the index of the board
    const handleBoardGameClick = (i, j) => {
        socket.emit('move_made', { i, j, room: "a"});
    };
    
    const renderBoard = (curr, j) => {
        // Set flag if board is available to be played on
        let boardActive = false;
        // TODO: Add in case where board has already been completed
        if (curr.availableBoard === j || curr.availableBoard === 4)
            boardActive = true;

        let displaySquares;
        // If board is won, then display all squares as winning player
        if (curr.bigSquares[j]) 
            displaySquares = Array(9).fill(curr.bigSquares[j])
        else 
            displaySquares = curr.squares[j]

        return (
            <Board
                squares={displaySquares}
                onClick={(i) => handleBoardGameClick(i, j)}
                active={boardActive}
            />
        );
    };

    return (
        <div className="game-board">
            <div className="grid">
                {renderBoard(current, 0)}
                {renderBoard(current, 1)}
                {renderBoard(current, 2)}
            
                {renderBoard(current, 3)}
                {renderBoard(current, 4)}
                {renderBoard(current, 5)}
            
                {renderBoard(current, 6)}
                {renderBoard(current, 7)}
                {renderBoard(current, 8)}
            </div> 
        </div>
    );
}

export default GameBoard;

