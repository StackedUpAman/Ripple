import bcrypt from "bcrypt"
import sql from "../db/postgres.js";
import { generateToken } from "../utilities/jwt.js";

export const handleSignup = async (req, res) => {
  try {
    const { email, password, confirmPassword} = req.body;    
    
    if(email == "" || password == "" || confirmPassword == ""){
      return res
      .status(400)
      .json({message: "All fields are required"})
    }

    if(password != confirmPassword){
      return res
      .status(400)
      .json({message: "Invalid user credentials"})
    }

    const [existingUser] = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
      LIMIT 1
     `;

     if(existingUser){
      return res
      .status(409)
      .json({message: "User with this email already exists"});
     }

    const hashedPassword = await bcrypt.hash(password,10);

    const private_key = await bcrypt.hash(email + password,10); 

    await sql`
    INSERT INTO users(email, password, private_key)
    VALUES (${email}, ${hashedPassword}, ${private_key})
    `;

    const token = generateToken(email);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)      
      .json({ 
        message: "User created", 
        anion_key: private_key
     });

  } catch (err) {
    return res
    .status(500)
    .json({ message: "Server error" });
  }
}

export const handleLogin = async (req, res) => {
  const { email, password} = req.body;

  const [user] = await sql`
  SELECT *
  FROM users
  WHERE email = ${email}
  LIMIT 1
  `;

  if(!user){
    return res
    .status(401)
    .json({message: "User not found"});
  }

  const validPassword = await bcrypt.compare(password, user.password);
  const validUser = await bcrypt.compare(email + password, user.private_key);

  if(!validUser || !validPassword){
    return res
    .status(401)
    .json({message: "Invalid user credentials"});
  }

  const token = generateToken(email);

  res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res
  .status(200)
  .json({message: "Login Successful"})
};

export const handleLogout = async (req, res) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: false,    
      sameSite: "lax",
    });

    return res
    .status(200)
    .json({message: "User Logged Out successfully"});
  } catch (error) {
    return res
    .status(500)
    .json({message: "Logout failed"})
  }
}