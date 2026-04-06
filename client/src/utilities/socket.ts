import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const initSocket = (token: string) => {
  if (socket) return socket;

  socket = io(apiBase, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket!.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
