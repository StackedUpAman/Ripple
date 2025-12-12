const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 4000;
const { generateAnionKey, generatePrivateKey } = require("./utilities/Hashing");
const cookieParser = require("cookie-parser");

require("dotenv").config();

// --- Middleware ---

// Use JSON parser only.
app.use(cors()); // configure origin in production
app.use(express.json()); // parse application/json
app.use(cookieParser());

// --- DB connect ---
mongoose
  .connect("mongodb://127.0.0.1:27017/Ripple4")
  .then(() => {
    console.log("MongoDB connected!");
    // Start server only after DB is connected
    app.listen(PORT, () => console.log(`✅ Server started at PORT ${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo Error", err);
    process.exit(1);
  });

// --- Schema & Model ---
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("Registered_Users", UserSchema);

// --- Routes ---
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ msg: "Email already registered" });
    }

    // Create user (store hashed password)
    const result = await User.create({
      email: email.toLowerCase().trim(),
      password,
    });

    //Generating Anion Key
    const anion_key = await generateAnionKey(email, password);
    console.log("ANION", anion_key);

    //Generating Private Key
    const private_key = await generatePrivateKey(email, password, 10);
    console.log("Private", private_key);

    return res
      .status(201)
      .cookie("uid", private_key)
      .json({ msg: "User created", userId: result._id });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) return res.status(401).json({ msg: "user not found" });

  //Generating Anion Key
  const anion_key = await generateAnionKey(email, password);
  console.log("ANION", anion_key);

  //Generating Private Key
  const private_key = await generatePrivateKey(email, password, 10);
  console.log("Private", private_key);

  return res.cookie("uid", anion_key).json({ hashed_pass: user.password });
});
