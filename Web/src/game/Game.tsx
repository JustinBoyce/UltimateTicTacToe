import { useState, useMemo } from 'react';
import getSocket from '../service/socket';
import { BoardState, PlayerRole, MoveMadePayload } from '../types';
import GameInfo from './GameInfo';
import GameBoard from './GameBoard';
import PostGameActions from './PostGameActions';
import {
  calculateMetaWinner,
  isMetaDraw,
  isGameTerminal,
} from './gameUtils';

interface GameProps {
  history?: BoardState[];
  playerRole: PlayerRole;
  currentRoom: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
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
    }],
    playerRole,
    currentRoom,
    onPlayAgain,
    onBackToLobby,
}: GameProps) {
    // TODO: Review if this non-singleton socket has any unexpected behavior
    const socket = getSocket();
    // Track the step number the user has manually navigated to
    const [userStepNumber, setUserStepNumber] = useState<number | null>(null);

    const effectiveStepNumber = useMemo(() => {
        return calculateEffectiveStepNumber(history.length, userStepNumber);
    }, [history.length, userStepNumber]);

    // Derive current view from effective stepNumber
    const currentViewedBoard = history[effectiveStepNumber];
    const winner = calculateMetaWinner(currentViewedBoard.bigSquares);
    const isDraw = !winner && isMetaDraw(currentViewedBoard.bigSquares);
    const xIsNext = currentViewedBoard.xIsNext;

    const lastBoard = history[history.length - 1];
    const terminalAtEnd = isGameTerminal(lastBoard);
    const atLatestStep = effectiveStepNumber === history.length - 1;

    // Check if it's the player's turn
    const isPlayerTurn = playerRole === 'X' ? xIsNext : !xIsNext;
    const canMakeMove = isPlayerTurn && !winner;

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
    // Only allow moves if we are on the last stepNumber and it's the player's turn
    const handleBoardGameClick = (i: number, j: number): void => {
        const lastStepNumber = history.length - 1;
        if (effectiveStepNumber === lastStepNumber && canMakeMove) {
            const payload: MoveMadePayload = {
                type: 'CLIENT',
                room: currentRoom,
                i,
                j
            };
            socket.emit('move_made', payload);
        }
    };

    return (
        <div className="game">
            {!canMakeMove && !winner && !isDraw && (
                <div className="turn-indicator">
                    Waiting for opponent's turn...
                </div>
            )}
            <GameBoard 
                current={currentViewedBoard}
                xIsNext={xIsNext}
                onBoardGameClick={handleBoardGameClick}
                canMakeMove={canMakeMove}
            />
            <GameInfo 
                history={history}
                xIsNext={xIsNext}
                winner={winner}
                isDraw={isDraw}
                onStepNumberChange={handleStepNumberChange}
                playerRole={playerRole}
            />
            {terminalAtEnd && atLatestStep && (
                <PostGameActions
                    onPlayAgain={onPlayAgain}
                    onBackToLobby={onBackToLobby}
                />
            )}
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

