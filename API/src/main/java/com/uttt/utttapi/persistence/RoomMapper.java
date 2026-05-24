package com.uttt.utttapi.persistence;

import java.time.Instant;

import org.springframework.stereotype.Component;

import com.uttt.utttapi.game.UltimateTicTacToe;
import com.uttt.utttapi.room.GameResult;
import com.uttt.utttapi.room.RecordStatus;
import com.uttt.utttapi.room.Room;
import com.uttt.utttapi.room.RoomStatus;

@Component
public class RoomMapper {

    public RoomEntity toNewEntity(String roomId, java.util.UUID playerXToken) {
        RoomEntity entity = new RoomEntity();
        entity.setRoomId(roomId);
        entity.setRecordStatus(RecordStatus.ACTIVE);
        entity.setGameStatus(RoomStatus.WAITING_FOR_PLAYER);
        entity.setGameResult(null);
        entity.setGameState(new UltimateTicTacToe().getState());
        entity.setPlayerXToken(playerXToken);
        entity.setPlayerOToken(null);
        entity.setDisconnectedPlayerToken(null);
        entity.setDisconnectAt(null);
        Instant now = Instant.now();
        entity.setCreatedAt(now);
        entity.setLastActivity(now);
        entity.setClosedAt(null);
        return entity;
    }

    public void syncToEntity(Room room, RoomEntity entity) {
        entity.setGameStatus(room.getStatus());
        entity.setGameResult(room.getGameResult());
        entity.setGameState(room.getGame().getState());
        entity.setPlayerXToken(room.getPlayerXToken());
        entity.setPlayerOToken(room.getPlayerOToken());
        entity.setDisconnectedPlayerToken(room.getDisconnectedPlayerToken());
        entity.setDisconnectAt(room.getDisconnectTime());
        entity.setLastActivity(room.getLastActivity() != null ? room.getLastActivity() : Instant.now());
    }

    public Room toRoom(RoomEntity entity) {
        Room room = new Room(entity.getRoomId(), entity.getId(), entity.getGameState());
        room.setStatus(entity.getGameStatus() != null ? entity.getGameStatus() : RoomStatus.WAITING_FOR_PLAYER);
        room.setGameResult(entity.getGameResult());
        room.setPlayerXToken(entity.getPlayerXToken());
        room.setPlayerOToken(entity.getPlayerOToken());
        room.setDisconnectedPlayerToken(entity.getDisconnectedPlayerToken());
        room.setDisconnectTime(entity.getDisconnectAt());
        room.setCreatedAt(entity.getCreatedAt());
        room.setLastActivity(entity.getLastActivity());
        return room;
    }

    public void applySoftClose(RoomEntity entity, GameResult gameResult) {
        entity.setRecordStatus(RecordStatus.INACTIVE);
        entity.setGameStatus(RoomStatus.ENDED);
        entity.setGameResult(gameResult);
        entity.setPlayerXToken(null);
        entity.setPlayerOToken(null);
        entity.setDisconnectedPlayerToken(null);
        entity.setDisconnectAt(null);
        entity.setClosedAt(Instant.now());
    }
}
