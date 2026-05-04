interface PostGameActionsProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function PostGameActions({
  onPlayAgain,
  onBackToLobby,
}: PostGameActionsProps) {
  return (
    <div className="post-game-actions" role="region" aria-label="Game over">
      <p className="post-game-actions-title">What&apos;s next?</p>
      <div className="post-game-actions-buttons">
        <button type="button" className="post-game-play-again" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="post-game-back-lobby" onClick={onBackToLobby}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}
