import {Server} from "socket.io";
import jwt from 'jsonwebtoken';

import dotenv from "dotenv";
dotenv.config();

let io;

export const initSocket = (httpServer) => {
  
  io = new Server(httpServer, {
    cors:{
      origin: "*",
            credentials: true,
            methods: ["GET", "POST"],
        }
    });
    
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
        })
    })

    return io;
}

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};