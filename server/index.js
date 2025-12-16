import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import {ConnectMongoDB} from "./connection.js";
import UserRouter from "./routes/user.js"
const app = express();
const PORT = process.env.PORT || 4000;

dotenv.config();

// --- Middleware ---.

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); 
app.use(cookieParser());

//connection
ConnectMongoDB("mongodb://127.0.0.1:27017/Ripple4")

// --- Routes ---
app.use("/api",UserRouter)

//Starting the server

app.listen(PORT, () => console.log(`Server started at PORT ${PORT}`));
