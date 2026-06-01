/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOT_SERVICE_URL?: string;
  readonly VITE_COLYSEUS_URL?: string;
  readonly VITE_LOBBY_API_URL?: string;
  readonly VITE_ONLINE_MULTIPLAYER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
