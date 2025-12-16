import { User } from "../model/user.js";
import {generateAnionKey} from "../utilities/Hashing.js";
import bcrypt from "bcrypt"

export async function handleSignup(req, res){
  try {
    const { email, password, private_key } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ msg: "Email already registered" });
    }

    //Generating Anion Key
    const anion_key = await generateAnionKey(email, password); //password is hashed already
    console.log("ANION", anion_key);

    // Create user (store hashed password)
    const result = await User.create({
      email: email.toLowerCase().trim(),
      anion_key: anion_key,
    });

    return res
      .status(201)
      .cookie("uid", private_key)
      .json({ msg: "User created", anion_key: anion_key });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
}

export async function handleLogin(req, res){
  const { email, password, private_key } = req.body;

  //checking if user exists
  const user = await User.findOne({ email: email });
  if (!user) return res.status(401).json({ msg: "user not found" });

  //validating with anion key
  const valid = bcrypt.compare(email + password, user.anion_key);

  return res.cookie("uid", private_key).json({ valid: valid });
};
