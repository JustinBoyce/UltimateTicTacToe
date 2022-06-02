// This file defines a single board and its squares
import React from 'react';

function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            {props.value}
        </button>
    );
}
    
class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square 
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }
    
    render() {  
        let styles = {
            border: '4px solid #000'
        };
        // If the board is active then outline in red
        if (this.props.active) {
            styles = {
                border: '4px solid rgb(200, 0, 0)'
            }
        }
        return (
        <div style={styles}>
            <div className="board-row">
            {this.renderSquare(0)}
            {this.renderSquare(1)}
            {this.renderSquare(2)}
            </div>
            <div className="board-row">
            {this.renderSquare(3)}
            {this.renderSquare(4)}
            {this.renderSquare(5)}
            </div>
            <div className="board-row">
            {this.renderSquare(6)}
            {this.renderSquare(7)}
            {this.renderSquare(8)}
            </div>
        </div>
        );
    } 
}

export default Board;