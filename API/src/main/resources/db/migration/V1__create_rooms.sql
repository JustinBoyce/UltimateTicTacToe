CREATE TABLE rooms (
    id                        BIGSERIAL PRIMARY KEY,
    room_id                   VARCHAR(6) NOT NULL,
    record_status             VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    game_status               VARCHAR(32) NOT NULL,
    game_result               VARCHAR(32),
    game_state                JSONB NOT NULL,
    player_x_token            UUID,
    player_o_token            UUID,
    disconnected_player_token UUID,
    disconnect_at             TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity             TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at                 TIMESTAMPTZ,
    version                   BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_record_status CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_game_status CHECK (game_status IN (
        'WAITING_FOR_PLAYER', 'IN_PROGRESS', 'WAITING_RECONNECT', 'ENDED'
    )),
    CONSTRAINT chk_game_result CHECK (game_result IS NULL OR game_result IN (
        'X_WIN', 'O_WIN', 'DRAW', 'RECONNECT_TIMEOUT', 'CANCELLED'
    ))
);

CREATE UNIQUE INDEX uq_rooms_active_room_id ON rooms (room_id) WHERE record_status = 'ACTIVE';
CREATE INDEX idx_rooms_room_id ON rooms (room_id);
CREATE INDEX idx_rooms_record_status ON rooms (record_status);
CREATE INDEX idx_rooms_active_reconnect ON rooms (disconnect_at)
    WHERE record_status = 'ACTIVE' AND game_status = 'WAITING_RECONNECT';
