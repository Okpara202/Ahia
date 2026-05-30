import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_BASE_URL;

let instance: Socket | null = null;

/**
 * Lazy-singleton Socket.io connection. The session cookie rides on the
 * upgrade request via `withCredentials`, so the backend authenticates the
 * user the same way it does for HTTP — no token in JS.
 *
 * Call `getSocket()` to obtain (and lazily open) the connection. Call
 * `disconnectSocket()` on logout to tear it down so a fresh session starts
 * cleanly the next time someone signs in.
 */
export function getSocket(): Socket {
  if (instance) return instance;
  instance = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ["websocket"],
  });
  return instance;
}

export function disconnectSocket(): void {
  if (!instance) return;
  instance.disconnect();
  instance = null;
}
