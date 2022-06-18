import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Board from './board.js';

  
class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array.from(Array(9), () => new Array(9).fill(null)),
                bigSquares: Array(9).fill(null),
                availableBoards: 4
            }],
            xIsNext: true,
            stepNumber: 0,
            historyStyle: {display: "none"}
        };
    }

    // Handle button clicks: i is the index of the square, j is the index of the board
    // Also handles most of the game logic
    handleClick(i, j) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        // slice() copies arrays within the arrays by reference so use map
        const squares = current.squares.map((element) => element.slice());
        const bigSquares = current.bigSquares.slice();

        
        const inactive = (current.availableBoards !== 4 && current.availableBoards !== j)
        // If the board has been decided, game is over, board is inactive, or the spot is already taken, make no further action
        if (bigSquares[j] || calculateWinner(bigSquares) || squares[j][i] || inactive) {
            return;
        }   

        // Set square as clicked
        squares[j][i] = this.state.xIsNext ? 'X' : 'O';

        // The next available board is based off the most recent square clicked
        let availableBoards = i;
        // if one of the baords has been completed, set bigSquares to proper value and make availableBoards 4
        // 4 is a special case of available boards (4 is the center square) that allows player to move anywhere
        if (calculateWinner(squares[j])) {
            bigSquares[j] = this.state.xIsNext ? 'X' : 'O';
            availableBoards = 4;
        }
        // if there is a tie, set bigSquares to '/'
        else if (isTied(squares[j])) {
            bigSquares[j] = '/'
        }
        // If board corresponding to i has been completed, then player can play anywhere
        if (bigSquares[i])
            availableBoards = 4;

        // Add our new state to the history
        const new_hist = history.concat([{
            squares: squares,
            bigSquares: bigSquares,
            availableBoards: availableBoards
        }])
        
        this.setState({
            history: new_hist,
            xIsNext: !this.state.xIsNext,
            stepNumber: history.length
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    handleShowHideHistoryClick() {
        if (this.state.historyStyle.display === "none") {
            this.setState({
                historyStyle: {display: "inline"}
            });
        }
        else 
            this.setState({
                historyStyle: {display: "none"}
            });
    }

    renderBoard(curr, j) {
        // Set flag if board is available to be played on
        let boardActive = false;
        // TODO: Add in case where board has already been completed
        if (curr.availableBoards === j || curr.availableBoards === 4)
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
                onClick={(i) => this.handleClick(i, j)}
                active={boardActive}
            />
        );
        
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.bigSquares);

        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            )
        })

        let status;
        if(winner) {
            status = 'Winner: ' + winner;
        }
        else {
            status = 'Next Player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        return (
            <div className="game">
                <div className="game-board">
                    <div className="grid">
                        {this.renderBoard(current, 0)}
                        {this.renderBoard(current, 1)}
                        {this.renderBoard(current, 2)}
                    
                        {this.renderBoard(current, 3)}
                        {this.renderBoard(current, 4)}
                        {this.renderBoard(current, 5)}
                    
                        {this.renderBoard(current, 6)}
                        {this.renderBoard(current, 7)}
                        {this.renderBoard(current, 8)}
                    </div> 
                </div>

                <button onClick={() => this.handleShowHideHistoryClick()}>Show/hide history</button>
                <div className="game-info" style={this.state.historyStyle}>
                    <div>{ status }</div>
                    <ol>{ moves }</ol>
                </div>
            </div>
        );
    }
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
  
  // ========================================
  
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<Game />);