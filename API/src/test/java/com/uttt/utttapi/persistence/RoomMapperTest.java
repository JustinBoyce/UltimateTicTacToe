package com.uttt.utttapi.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.RecordStatus;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.room.RoomStatus;

class RoomMapperTest {

    private final RoomMapper mapper = new RoomMapper();

    @Test
    void roundTripNewEntityAndRoom() {
        String roomId = "XYZ789";
        UUID xToken = UUID.randomUUID();
        RoomEntity entity = mapper.toNewEntity(roomId, xToken);
        entity.setId(1L);

        Room room = mapper.toRoom(entity);
        assertEquals(roomId, room.getRoomId());
        assertEquals(1L, room.getDbId());
        assertEquals(xToken, room.getPlayerXToken());
        assertEquals(RoomStatus.WAITING_FOR_PLAYER, room.getStatus());
        assertEquals(1, room.getGame().getState().getHistory().size());
    }

    @Test
    void applySoftCloseClearsTokens() {
        RoomEntity entity = mapper.toNewEntity("ABC123", UUID.randomUUID());
        mapper.applySoftClose(entity, GameResult.CANCELLED);
        assertEquals(RecordStatus.INACTIVE, entity.getRecordStatus());
        assertEquals(RoomStatus.ENDED, entity.getGameStatus());
        assertEquals(GameResult.CANCELLED, entity.getGameResult());
        assertNull(entity.getPlayerXToken());
        assertNull(entity.getPlayerOToken());
    }
}
