const ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_ID_LENGTH = 5;

export function normalizeRoomId(input: string): string {
  return input.trim().toUpperCase();
}

export function generateRoomId(): string {
  const randomValues = new Uint32Array(ROOM_ID_LENGTH);
  crypto.getRandomValues(randomValues);
  let id = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ID_CHARS[randomValues[i] % ROOM_ID_CHARS.length];
  }
  return id;
}
