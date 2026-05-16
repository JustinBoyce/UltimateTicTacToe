import type { PlayerRole } from '../types';

const STORAGE_KEY = 'uttt_room_session';

export interface RoomSession {
  roomId: string;
  playerRole: PlayerRole;
}

export function saveRoomSession(roomId: string, playerRole: PlayerRole): void {
  if (!playerRole) return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ roomId, playerRole } satisfies RoomSession),
  );
}

export function loadRoomSession(): RoomSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoomSession;
    if (parsed?.roomId && (parsed.playerRole === 'X' || parsed.playerRole === 'O')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
