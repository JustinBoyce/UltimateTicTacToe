import { useState } from 'react';
import { BoardState, SquareValue, PlayerRole } from '../types';

interface GameInfoProps {
  history: BoardState[];
  xIsNext: boolean;
  winner: SquareValue;
  onStepNumberChange: (step: number) => void;
  playerRole: PlayerRole;
}

// This component manages the display of the history, the display of the next player up, and handles stepNumber changes
function GameInfo({ history, xIsNext, winner, onStepNumberChange, playerRole }: GameInfoProps) {
    // stepNumber needs to be updated to the most recent step when a new state is sent from the BE
    // stepNumber needs to be updated when one of the history buttons is clicked
    const [historyStyle, setHistoryStyle] = useState<{ display: string }>({display: "none"});

    const jumpTo = (step: number): void => {
        if (onStepNumberChange) {
            onStepNumberChange(step);
        }
    };

    const handleShowHideHistoryClick = (): void => {
        setHistoryStyle((prev) =>
            prev.display === "none" ? { display: "block" } : { display: "none" }
        );
    };

    const moves = history.map((_, move) => {
        const desc = move ?
            'Go to move #' + move :
            'Go to game start';
        return (
            <li key={move}>
                <button onClick={() => jumpTo(move)}>{desc}</button>
            </li>
        )
    });

    let status: string;
    if (winner) {
        status = `Winner: ${winner}`;
        if (playerRole === winner) {
            status += ' (You won!)';
        } else {
            status += ' (You lost)';
        }
    } else {
        const nextPlayer = xIsNext ? 'X' : 'O';
        status = `Next Player: ${nextPlayer}`;
        if (playerRole === nextPlayer) {
            status += ' (Your turn)';
        } else {
            status += ' (Opponent\'s turn)';
        }
    }

    return (
        <div className="game-info-panel">
            <div className="status">{status}</div>
            <button type="button" onClick={() => handleShowHideHistoryClick()}>
                Show/hide history
            </button>
            <div className="game-info" style={historyStyle}>
                <ol>{moves}</ol>
            </div>
        </div>
    );
}

export default GameInfo;

