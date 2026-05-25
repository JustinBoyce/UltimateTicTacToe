package com.uttt.utttapi.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.RecordStatus;
import com.uttt.utttapi.room.Room;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomPersistenceService {

    private static final long RECONNECTION_TIMEOUT_SECONDS = 60;

    private final RoomRepository roomRepository;
    private final RoomMapper roomMapper;

    @Transactional
    public RoomEntity insertNewRoom(String roomId, UUID playerXToken) {
        RoomEntity entity = roomMapper.toNewEntity(roomId, playerXToken);
        return roomRepository.save(entity);
    }

    private static final int MAX_OPTIMISTIC_RETRIES = 3;

    @Transactional
    public Room saveRoom(Room room) {
        ObjectOptimisticLockingFailureException lastFailure = null;
        for (int attempt = 0; attempt < MAX_OPTIMISTIC_RETRIES; attempt++) {
            try {
                RoomEntity entity = roomRepository.findById(room.getDbId())
                        .orElseThrow(() -> new IllegalStateException(
                                "Room entity not found for id " + room.getDbId()));
                roomMapper.syncToEntity(room, entity);
                RoomEntity saved = roomRepository.save(entity);
                return roomMapper.toRoom(saved);
            } catch (ObjectOptimisticLockingFailureException ex) {
                lastFailure = ex;
            }
        }
        throw lastFailure;
    }

    @Transactional(readOnly = true)
    public Optional<Room> findActiveByRoomId(String roomId) {
        return roomRepository.findByRoomIdAndRecordStatus(roomId, RecordStatus.ACTIVE)
                .map(roomMapper::toRoom);
    }

    @Transactional
    public void softClose(Room room, GameResult gameResult) {
        RoomEntity entity = roomRepository.findById(room.getDbId())
                .orElseThrow(() -> new IllegalStateException("Room entity not found for id " + room.getDbId()));
        GameResult finalResult = entity.getGameResult() != null ? entity.getGameResult() : gameResult;
        roomMapper.applySoftClose(entity, finalResult);
        roomRepository.save(entity);
    }

    @Transactional
    public List<RoomEntity> findAndSoftCloseExpiredReconnects() {
        Instant cutoff = Instant.now().minusSeconds(RECONNECTION_TIMEOUT_SECONDS);
        List<RoomEntity> expired = roomRepository.findActiveWaitingReconnectExpired(cutoff);
        for (RoomEntity entity : expired) {
            roomMapper.applySoftClose(entity, GameResult.RECONNECT_TIMEOUT);
            roomRepository.save(entity);
        }
        return expired;
    }
}
