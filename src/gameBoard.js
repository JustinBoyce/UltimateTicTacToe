import Board from './board.js';
import React from 'react';

// This component manages displaying the full game board and handles moves being made
// TODO: Prevent players from playing a move when it is not their turn
function GameBoard({ current, xIsNext, onBoardGameClick }) {
    
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
                key={j}
                squares={displaySquares}
                onClick={(i) => onBoardGameClick(i, j)}
                active={boardActive}
            />
        );
    };

    return (
        <div className="game-board">
            <div className="grid">
            {Array.from({ length: 9 }, (_, j) => renderBoard(current, j))}
            </div> 
        </div>
    );
}

export default GameBoard;

