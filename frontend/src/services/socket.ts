import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/** Connects (once) and joins the admin notification room, authenticating
 * with the current JWT so the server can verify the caller is really an
 * admin before letting them into that room. */
export function connectAdminSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    socket?.emit("join_admin_room", { token: accessToken });
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
