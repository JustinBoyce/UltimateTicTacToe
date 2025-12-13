import React, { useState } from 'react';

// This component manages the display of the history, the display of the next player up, and handles stepNumber changes
function GameInfo({ history, xIsNext, winner, onStepNumberChange }) {
    // stepNumber needs to be updated to the most recent step when a new state is sent from the BE
    // stepNumber needs to be updated when one of the history buttons is clicked
    const [historyStyle, setHistoryStyle] = useState({display: "none"});

    const jumpTo = (step) => {
        if (onStepNumberChange) {
            onStepNumberChange(step);
        }
    };

    const handleShowHideHistoryClick = () => {
        if (historyStyle.display === "none") {
            setHistoryStyle({display: "inline"});
        }
        else {
            setHistoryStyle({display: "none"});
        }
    };

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

    const status = winner ? 'Winner: ' + winner : 'Next Player: ' + (xIsNext ? 'X' : 'O')

    return (
        <>
            <button onClick={() => handleShowHideHistoryClick()}>Show/hide history</button>
            <div className="game-info" style={historyStyle}>
                <div>{ status }</div>
                <ol>{ moves }</ol>
            </div>
        </>
    );
}

export default GameInfo;

