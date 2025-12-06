// This file defines a single board and its squares
import React from 'react';
    
export default function Board(props) {
    const renderSquare = (i) => {
        return (
            <button className="square" onClick={() => props.onClick(i)}>
                {props.squares[i]}
            </button>
        );
    };

    let styles = {
        border: '4px solid #000'
    };
    // If the board is active then outline in red
    if (props.active) {
        styles = {
            border: '4px solid rgb(200, 0, 0)'
        }
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
