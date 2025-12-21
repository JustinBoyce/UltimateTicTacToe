import { useState, useMemo } from 'react';
import GameBoard from './GameBoard';
import GameInfo from './GameInfo';
import socket from './service/socket';
import { BoardState, SquareValue } from './types';

interface GameProps {
  history?: BoardState[];
}

// This component takes history and next player up as props from the backend. 
// It calculates if the board has been won, tracks if the user is viewing a previous step
// Passes needed data to GameBoard and GameInfo
export default function Game({ 
    history = [{
        squares: Array.from(Array(9), () => new Array(9).fill(null)),
        bigSquares: Array(9).fill(null),
        availableBoard: 4,
        xIsNext: true
    }]
}: GameProps) {
    // Track the step number the user has manually navigated to
    const [userStepNumber, setUserStepNumber] = useState<number | null>(null);

    const effectiveStepNumber = useMemo(() => {
        return calculateEffectiveStepNumber(history.length, userStepNumber);
    }, [history.length, userStepNumber]);

    // Derive current view from effective stepNumber
    const currentViewedBoard = history[effectiveStepNumber];
    const winner = calculateWinner(currentViewedBoard.bigSquares);
    const xIsNext = currentViewedBoard.xIsNext;

    // Handle stepNumber changes from child component
    const handleStepNumberChange = (newStepNumber: number): void => {
        // If the user moves back to the most recent step then go back to updating every time there is new history
        if (newStepNumber === history.length - 1) {
            setUserStepNumber(null);
        } else {
            setUserStepNumber(newStepNumber);
        }
    };

    // Handle button clicks: i is the index of the square, j is the index of the board
    // Only allow moves if we are on the last stepNumber
    const handleBoardGameClick = (i: number, j: number): void => {
        const lastStepNumber = history.length - 1;
        if (effectiveStepNumber === lastStepNumber) {
            socket.emit('move_made', { i, j, room: "a"});
        }
    };

    return (
        <div className="game">
            <GameBoard 
                current={currentViewedBoard}
                xIsNext={xIsNext}
                onBoardGameClick={handleBoardGameClick}
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

// Calculate effective stepNumber during render (always up-to-date)
const calculateEffectiveStepNumber = (historyLength: number, userStepNumber: number | null): number => {
    const latestStep = historyLength - 1;
    
    // If user manually navigated, use their choice (clamped to valid range)
    if (userStepNumber !== null) {
        const validStep = Math.max(0, Math.min(userStepNumber, latestStep));
        return validStep;
    }
    
    // Default: use latest step
    return latestStep;
};

// This function returns 'X' or 'O' if there is a winner, otherwise returns null
function calculateWinner(squares: SquareValue[]): SquareValue {
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
    for (let player of ['X', 'O'] as const) {
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

