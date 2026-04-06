import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import Redis from "ioredis";
import { redis } from "../utilities/redisClient.js";

import dotenv from "dotenv";
dotenv.config();

let io;

// Create a dedicated subscriber connection (separate from the main redis client)
const redisSubscriber = new Redis(process.env.REDIS_URL);

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
      methods: ["GET", "POST"],
    }
  });

  // ✅ Subscribe to the toxic_retractions channel published by Python server
  redisSubscriber.subscribe('toxic_retractions', (err, count) => {
    if (err) {
      console.error("❌ Failed to subscribe to toxic_retractions:", err);
    } else {
      console.log("🎧 Node is listening for toxic retractions...");
    }
  });

  // ✅ When Python publishes a retraction message, broadcast it to the room
  redisSubscriber.on('message', (channel, message) => {
    if (channel === 'toxic_retractions') {
      const data = JSON.parse(message);
      console.log(`🚨 Retracting message ${data.id} in chat ${data.chatId}`);
      io.emit('message_retracted', { id: data.id, chatId: data.chatId });
    }
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.error("Token missing");
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);

      socket.user = {
        id: decoded.id,
        username: decoded.username,
      };
      console.log(socket.user);

      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Unauthorized socket"));
    }
  });

  io.on("connection", (socket) => {
    console.log('Socket connected');

    socket.on("disconnect", () => {
      console.log('Socket disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};