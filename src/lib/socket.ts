import type { Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE_URL;

let instance: Socket | null = null;
let connecting: Promise<Socket> | null = null;

/**
 * Lazy-singleton Socket.io connection. The `socket.io-client` module is
 * imported dynamically so its ~40KB raw / ~13KB gzipped bundle only ships
 * for authed surfaces — marketing pages, login, signup, etc. don't pay
 * for it on first paint.
 *
 * The session cookie rides on the upgrade request via `withCredentials`,
 * so the backend authenticates the user the same way it does for HTTP —
 * no token in JS.
 *
 * Call `getSocket()` to obtain (and lazily open) the connection. Multiple
 * concurrent calls share the same in-flight import. Call
 * `disconnectSocket()` on logout to tear it down so a fresh session
 * starts cleanly the next time someone signs in.
 */
export async function getSocket(): Promise<Socket> {
  if (instance) return instance;
  if (connecting) return connecting;
  connecting = (async () => {
    const { io } = await import("socket.io-client");
    const s = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket"],
    });
    instance = s;
    connecting = null;
    return s;
  })();
  return connecting;
}

export function disconnectSocket(): void {
  if (!instance) return;
  instance.disconnect();
  instance = null;
}
