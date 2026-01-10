import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import UserRouter from "./routes/user.js"
import sql from "./db/postgres.js";

const app = express();
const PORT = process.env.PORT || 4000;

dotenv.config();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json()); 
app.use(cookieParser());

app.listen(PORT, () =>
  console.log(`Server started at PORT ${PORT}`)
);

app.use("/api",UserRouter)