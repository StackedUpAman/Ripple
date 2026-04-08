import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import chatRouter from './routes/chat.routes.js';
import http from "http";
import { initSocket } from "./socket/index.js";
import { startRoomExpiryJob } from "./services/socket.services.js";
import { attachIO } from "./middleware/socket.middleware.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initSocket(server);

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL
    ],
    credentials: true,
  })
);

app.use(express.json()); 
app.use(cookieParser());

app.use(attachIO);

app.use("/auth",authRouter)
app.use("/groupchat",chatRouter)
app.use("/directChat",chatRouter)

// startRoomExpiryJob();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});