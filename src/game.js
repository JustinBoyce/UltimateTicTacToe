
import React, { useState, useRef, useMemo } from 'react';
import GameBoard from './gameBoard';
import GameInfo from './gameInfo';

// This component takes history and next player up as props from the backend. 
// It calculates if the board has been won, tracks if the user is viewing a previous step
// Passes needed data to GameBoard and GameInfo
export default function Game({ 
    history = [{
        squares: Array.from(Array(9), () => new Array(9).fill(null)),
        bigSquares: Array(9).fill(null),
        availableBoard: 4
    }], 
    xIsNext = true
}) {
    // Track the step number the user has manually navigated to
    const [userStepNumber, setUserStepNumber] = useState(null);
    // Track previous history length to detect when it grows
    const prevHistoryLengthRef = useRef(history.length);

    // Calculate effective stepNumber during render (always up-to-date)
    const effectiveStepNumber = useMemo(() => {
        const latestStep = history.length - 1;
        const prevLength = prevHistoryLengthRef.current;
        
        // If history grew and user wasn't manually navigating, use latest
        if (history.length > prevLength && userStepNumber === null) {
            prevHistoryLengthRef.current = history.length;
            return latestStep;
        }
        
        // If user manually navigated, use their choice (clamped to valid range)
        if (userStepNumber !== null) {
            const validStep = Math.max(0, Math.min(userStepNumber, latestStep));
            prevHistoryLengthRef.current = history.length;
            return validStep;
        }
        
        // Default: use latest step
        prevHistoryLengthRef.current = history.length;
        return latestStep;
    }, [history.length, userStepNumber]);

    // Derive current state from effective stepNumber
    const current = history[effectiveStepNumber];
    const winner = calculateWinner(current.bigSquares);

    // Handle stepNumber changes from child component
    const handleStepNumberChange = (newStepNumber) => {
        setUserStepNumber(newStepNumber);
    };

    return (
        <div className="game">
            <GameBoard 
                current={current}
                xIsNext={xIsNext}
            />
            <GameInfo 
                history={history}
                stepNumber={effectiveStepNumber}
                xIsNext={xIsNext}
                winner={winner}
                onStepNumberChange={handleStepNumberChange}
            />
        </div>
    );
}

// This function returns 'X' or 'O' if there is a winner, otherwise returns null
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