package com.uttt.utttapi.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.RecordStatus;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.room.RoomIdGenerator;
import com.uttt.utttapi.room.RoomStatus;
import com.uttt.utttapi.support.PostgresIntegrationTestBase;

@SpringBootTest
@EnabledIf("com.uttt.utttapi.support.DockerTestSupport#enabled")
class RoomPersistenceIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired
    private RoomPersistenceService roomPersistenceService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMapper roomMapper;

    @Autowired
    private RoomIdGenerator roomIdGenerator;

    @Test
    void insertAndLoadActiveRoom() {
        String roomId = roomIdGenerator.generateUniqueActiveRoomId();
        UUID xToken = UUID.randomUUID();
        RoomEntity entity = roomPersistenceService.insertNewRoom(roomId, xToken);
        assertNotNull(entity.getId());

        Room loaded = roomPersistenceService.findActiveByRoomId(roomId).orElseThrow();
        assertEquals(roomId, loaded.getRoomId());
        assertEquals(xToken, loaded.getPlayerXToken());
        assertEquals(RoomStatus.WAITING_FOR_PLAYER, loaded.getStatus());
    }

    @Test
    void softCloseAndReuseRoomCode() {
        String roomId = "ABC123";
        RoomEntity first = roomPersistenceService.insertNewRoom(roomId, UUID.randomUUID());
        Room room = roomMapper.toRoom(first);
        roomPersistenceService.softClose(room, GameResult.CANCELLED);

        assertTrue(roomPersistenceService.findActiveByRoomId(roomId).isEmpty());
        RoomEntity inactive = roomRepository.findById(first.getId()).orElseThrow();
        assertEquals(RecordStatus.INACTIVE, inactive.getRecordStatus());
        assertEquals(GameResult.CANCELLED, inactive.getGameResult());

        RoomEntity second = roomPersistenceService.insertNewRoom(roomId, UUID.randomUUID());
        assertTrue(second.getId() > first.getId());
        assertEquals(RecordStatus.ACTIVE, second.getRecordStatus());
    }

    @Test
    void roomIdGeneratorProducesSixCharCode() {
        String id = roomIdGenerator.generateUniqueActiveRoomId();
        assertEquals(6, id.length());
        assertTrue(RoomIdGenerator.isValidRoomId(id));
    }
}
