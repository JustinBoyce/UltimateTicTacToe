import { ReactNode } from 'react';

type GameControlsProps = {
  onResetBoard: () => void;
  onSetAlmostWon: () => void;
  children?: ReactNode;
};

function GameControls({
  onResetBoard,
  onSetAlmostWon,
  children
}: GameControlsProps) {
  return (
    <div className="game-controls">
      <button onClick={onResetBoard} className="reset-button">
        Reset Board
      </button>
      <button onClick={onSetAlmostWon} className="test-state-button">
        Set Almost Won
      </button>
      {children}
    </div>
  );
}

export default GameControls;
