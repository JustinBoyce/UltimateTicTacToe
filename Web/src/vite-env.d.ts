/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full origin (and optional path) of the Socket.IO server, e.g. http://localhost:8085 */
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
