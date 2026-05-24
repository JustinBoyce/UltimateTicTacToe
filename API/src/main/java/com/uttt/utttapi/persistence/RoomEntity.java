package com.uttt.utttapi.persistence;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.uttt.utttapi.game.state.State;
import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.RecordStatus;
import com.uttt.utttapi.room.RoomStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "rooms")
@Getter
@Setter
public class RoomEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, length = 6)
    private String roomId;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_status", nullable = false, length = 16)
    private RecordStatus recordStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_status", nullable = false, length = 32)
    private RoomStatus gameStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_result", length = 32)
    private GameResult gameResult;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "game_state", nullable = false, columnDefinition = "jsonb")
    private State gameState;

    @Column(name = "player_x_token")
    private UUID playerXToken;

    @Column(name = "player_o_token")
    private UUID playerOToken;

    @Column(name = "disconnected_player_token")
    private UUID disconnectedPlayerToken;

    @Column(name = "disconnect_at")
    private Instant disconnectAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_activity", nullable = false)
    private Instant lastActivity;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Version
    private Long version;
}
