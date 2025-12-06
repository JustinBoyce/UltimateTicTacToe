
import Board from './board.js';
import React, { useState, useEffect } from 'react';
import socket from './service/socket';


// TODO: Remove game logic and replace with sending/accepting messages to/from the BE
export default function Game({ 
    history = [{
        squares: Array.from(Array(9), () => new Array(9).fill(null)),
        bigSquares: Array(9).fill(null),
        availableBoard: 4
    }], 
    xIsNext = true
}) {
    const [stepNumber, setStepNumber] = useState(0);
    const [historyStyle, setHistoryStyle] = useState({display: "none"});

    // Update stepNumber when prop changes
    // Need this because a user should be able to navigate the history visually without changing the game for anyone else
    useEffect(() => {
        setStepNumber(history.length - 1);
    }, [history.length]);

    // Handle button clicks: i is the index of the square, j is the index of the board
    const handleClick = (i, j) => {
        socket.emit('move_made', { i, j, room: "a"});
    };

    const jumpTo = (step) => {
        setStepNumber(step);
        // Note: xIsNext is now controlled by props from App component
    };

    const handleShowHideHistoryClick = () => {
        if (historyStyle.display === "none") {
            setHistoryStyle({display: "inline"});
        }
        else {
            setHistoryStyle({display: "none"});
        }
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
                onClick={(i) => handleClick(i, j)}
                active={boardActive}
            />
        );
    };

    const current = history[stepNumber];
    const winner = calculateWinner(current.bigSquares);

    const moves = history.map((step, move) => {
        const desc = move ?
            'Go to move #' + move :
            'Go to game start';
        return (
            <li key={move}>
                <button onClick={() => jumpTo(move)}>{desc}</button>
            </li>
        )
    });

    let status;
    if(winner) {
        status = 'Winner: ' + winner;
    }
    else {
        status = 'Next Player: ' + (xIsNext ? 'X' : 'O');
    }

    return (
        <div className="game">
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

            <button onClick={() => handleShowHideHistoryClick()}>Show/hide history</button>
            <div className="game-info" style={historyStyle}>
                <div>{ status }</div>
                <ol>{ moves }</ol>
            </div>
        </div>
    );
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    // Tied squares work for both teams
    // TODO: try to refactor and improve this code
    for (let player of ['X', 'O']) {
        let fixedSquares = squares.slice();
        for (let k = 0; k < fixedSquares.length; k++) {
            if (fixedSquares[k] === '/')
                fixedSquares[k] = player;
        }
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (fixedSquares[a] && fixedSquares[a] === fixedSquares[b] && fixedSquares[a] === fixedSquares[c]) {
                return fixedSquares[a];
            }
        }
    }
    
    return null;
}

function isTied(squares) {
    for(let k = 0; k < squares.length; k++) {
        // if a square has not been assigned a value, there is no tie
        if (!squares[k])
            return false;
    }
    return true;
}