import type { PlayerRole } from '../types';

const STORAGE_KEY = 'uttt_room_session';

export interface RoomSession {
  roomId: string;
  playerRole: PlayerRole;
  playerToken: string;
}

export function saveRoomSession(
  roomId: string,
  playerRole: PlayerRole,
  playerToken: string,
): void {
  if (!playerRole || !playerToken) return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ roomId, playerRole, playerToken } satisfies RoomSession),
  );
}

export function loadRoomSession(): RoomSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoomSession;
    if (
      parsed?.roomId &&
      (parsed.playerRole === 'X' || parsed.playerRole === 'O') &&
      parsed.playerToken
    ) {
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
