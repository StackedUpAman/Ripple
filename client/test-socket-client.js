import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { id: "test-user-1", username: "dummyUser" },
  "Ripple",
  { expiresIn: "5m" }
);

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: {
    token,
  },
});


socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ connect_error");
  console.error("message:", err.message);
  console.error("data:", err.data);
});


socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
