package com.uttt.utttapi.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.uttt.utttapi.room.RecordStatus;

public interface RoomRepository extends JpaRepository<RoomEntity, Long> {

    Optional<RoomEntity> findByRoomIdAndRecordStatus(String roomId, RecordStatus recordStatus);

    boolean existsByRoomIdAndRecordStatus(String roomId, RecordStatus recordStatus);

    @Query("""
            SELECT r FROM RoomEntity r
            WHERE r.recordStatus = com.uttt.utttapi.room.RecordStatus.ACTIVE
              AND r.gameStatus = com.uttt.utttapi.room.RoomStatus.WAITING_RECONNECT
              AND r.disconnectAt IS NOT NULL
              AND r.disconnectAt < :cutoff
            """)
    List<RoomEntity> findActiveWaitingReconnectExpired(@Param("cutoff") Instant cutoff);
}
