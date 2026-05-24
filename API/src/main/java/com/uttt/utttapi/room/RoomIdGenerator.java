package com.uttt.utttapi.room;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

import com.uttt.utttapi.persistence.RoomRepository;

@Component
public class RoomIdGenerator {

    private static final int MAX_ATTEMPTS = 20;

    private final RoomRepository roomRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomIdGenerator(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public String generateUniqueActiveRoomId() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String candidate = generateCandidate();
            if (!roomRepository.existsByRoomIdAndRecordStatus(candidate, RecordStatus.ACTIVE)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Failed to generate unique active room id after " + MAX_ATTEMPTS + " attempts");
    }

    public static boolean isValidRoomId(String roomId) {
        if (roomId == null || roomId.length() != RoomIdConstants.LENGTH) {
            return false;
        }
        for (int i = 0; i < roomId.length(); i++) {
            if (RoomIdConstants.CHARS.indexOf(roomId.charAt(i)) < 0) {
                return false;
            }
        }
        return true;
    }

    private String generateCandidate() {
        StringBuilder sb = new StringBuilder(RoomIdConstants.LENGTH);
        for (int i = 0; i < RoomIdConstants.LENGTH; i++) {
            int index = secureRandom.nextInt(RoomIdConstants.CHARS.length());
            sb.append(RoomIdConstants.CHARS.charAt(index));
        }
        return sb.toString();
    }
}
