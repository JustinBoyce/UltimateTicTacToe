export const ROOM_ID_LENGTH = 6;

export function normalizeRoomId(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidRoomId(input: string): boolean {
  const normalized = normalizeRoomId(input);
  if (normalized.length !== ROOM_ID_LENGTH) {
    return false;
  }
  return /^[A-Z0-9]+$/.test(normalized);
}
