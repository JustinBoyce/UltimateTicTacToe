// This file defines a single board and its squares
import React from 'react';
import { SquareValue } from '../types';

interface BoardProps {
  squares: SquareValue[];
  onClick: (i: number) => void;
  active: boolean;
  disabled?: boolean;
}
    
export default function Board({ squares, onClick, active, disabled }: BoardProps) {
    const renderSquare = (i: number) => {
        const isSquareEmpty = !squares[i];
        const isClickable = active && isSquareEmpty && !disabled;
        
        return (
            <button 
                className={`square ${isClickable ? 'clickable' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => isClickable && onClick(i)}
                disabled={!isClickable}
            >
                {squares[i]}
            </button>
        );
    };

    let styles: React.CSSProperties = {
        border: '4px solid #000',
        opacity: disabled ? 0.6 : 1
    };
    // If the board is active then outline in red
    if (active) {
        styles = {
            ...styles,
            border: '4px solid rgb(200, 0, 0)'
        };
    }
    
    return (
        <div style={styles}>
            <div className="board-row">
                {renderSquare(0)}
                {renderSquare(1)}
                {renderSquare(2)}
            </div>
            <div className="board-row">
                {renderSquare(3)}
                {renderSquare(4)}
                {renderSquare(5)}
            </div>
            <div className="board-row">
                {renderSquare(6)}
                {renderSquare(7)}
                {renderSquare(8)}
            </div>
        </div>
    );
}

