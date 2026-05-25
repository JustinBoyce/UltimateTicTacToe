package com.uttt.utttapi.room;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.uttt.utttapi.persistence.RoomRepository;

@ExtendWith(MockitoExtension.class)
class RoomIdGeneratorTest {

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private RoomIdGenerator roomIdGenerator;

    @Test
    void generateUniqueActiveRoomId_returnsSixCharCode() {
        when(roomRepository.existsByRoomIdAndRecordStatus(any(), eq(RecordStatus.ACTIVE))).thenReturn(false);
        String id = roomIdGenerator.generateUniqueActiveRoomId();
        assertEquals(RoomIdConstants.LENGTH, id.length());
        assertTrue(RoomIdGenerator.isValidRoomId(id));
    }

    @Test
    void isValidRoomId_rejectsWrongLength() {
        assertTrue(!RoomIdGenerator.isValidRoomId("ABC"));
    }
}
