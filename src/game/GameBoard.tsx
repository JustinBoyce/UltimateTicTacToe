import { BoardState, SquareValue } from '../types';
import Board from './Board';

interface GameBoardProps {
  current: BoardState;
  xIsNext: boolean;
  onBoardGameClick: (i: number, j: number) => void;
  canMakeMove: boolean;
}

// This component manages displaying the full game board and handles moves being made
function GameBoard({ current, onBoardGameClick, canMakeMove }: GameBoardProps) {
    
    const renderBoard = (curr: BoardState, j: number) => {
        // Set flag if board is available to be played on
        let boardActive = false;
        // Board is active if it's the available board and player can make moves
        if (canMakeMove && (curr.availableBoard === j || curr.availableBoard === 4)) {
            // Also check if board is not already won or tied
            if (!curr.bigSquares[j]) {
                boardActive = true;
            }
        }

        let displaySquares: SquareValue[];
        // If board is won, then display all squares as winning player
        if (curr.bigSquares[j]) 
            displaySquares = Array(9).fill(curr.bigSquares[j]) as SquareValue[]
        else 
            displaySquares = curr.squares[j]

        return (
            <Board
                key={j}
                squares={displaySquares}
                onClick={(i) => onBoardGameClick(i, j)}
                active={boardActive}
                disabled={!canMakeMove}
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

