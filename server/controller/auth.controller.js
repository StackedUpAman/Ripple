import bcrypt from "bcrypt"
import sql from "../db/postgres.js";
import { generateToken } from "../utilities/jwt.js";
import { generateUsername, removeUsername } from "../services/username.service.js";
import { sendMail } from "../services/nodemailer.services.js";

export const handleSignup = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;    
    
    if(email == "" || password == "" || confirmPassword == ""){
      return res
        .status(400)
        .json({message: "All fields are required"})
    }

    if(password != confirmPassword){
      return res
        .status(400)
        .json({message: "Passwords do not match"})
    }

    const [existingUser] = await sql`
      SELECT id, is_verified
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if(existingUser && existingUser.is_verified){
      return res
        .status(409)
        .json({message: "User with this email already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const private_key = await bcrypt.hash(email + password, 10); 
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if(existingUser && !existingUser.is_verified){
      await sql`
        UPDATE users
        SET password = ${hashedPassword},
            private_key = ${private_key},
            otp = ${hashedOtp},
            otp_expiry = ${otpExpiry}
        WHERE email = ${email}
      `;
    } else {
      await sql`
        INSERT INTO users(email, password, private_key, otp, otp_expiry, is_verified)
        VALUES (${email}, ${hashedPassword}, ${private_key}, ${hashedOtp}, ${otpExpiry}, false)
      `;
    }

    await sendMail({email, otp});

    return res
      .status(201)      
      .json({ 
        message: "OTP sent to your email. Please verify to complete signup.",
        email
      });

  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error" });
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if(!email || !otp){
      return res
        .status(400)
        .json({message: "Email and OTP are required"});
    }

    const [user] = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if(!user){
      return res
        .status(404)
        .json({message: "User not found"});
    }

    if(user.is_verified){
      return res
        .status(400)
        .json({message: "User already verified"});
    }

    if(new Date() > new Date(user.otp_expiry)){
      return res
        .status(400)
        .json({message: "OTP has expired. Please request a new one."});
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if(!isOtpValid){
      return res
        .status(400)
        .json({message: "Invalid OTP"});
    }

    const username = await generateUsername();

    const [updatedUser] = await sql`
      UPDATE users
      SET is_verified = true,
          username = ${username},
          otp = NULL,
          otp_expiry = NULL
      WHERE email = ${email}
      RETURNING *
    `;

    const token = generateToken(email);

    res.cookie("username", username);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)      
      .json({ 
        user: updatedUser,
        message: "User verified successfully",
        username, 
        anion_key: updatedUser.private_key,
        token
      });

  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error" });
  }
}

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
    }

    const [user] = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found" });
    }

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ 
          message: "Account not verified. Signup required.",
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    const validUser = await bcrypt.compare(email + password, user.private_key);

    if (!validUser || !validPassword) {
      return res
        .status(401)
        .json({ message: "Invalid user credentials" });
    }

    const token = generateToken(email);

    const username = await generateUsername();

    await sql`   
      UPDATE users
      SET username = ${username}
      WHERE id = ${user.id}
    `;

    res.cookie("username", username);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json({
        user: { ...user, username, password: undefined, otp: undefined, private_key: undefined },
        message: "Login Successful",
        username,
        token
      });

  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error" });
  }
};

export const handleLogout = async (req, res) => {
  try {    
    const user = await sql`
      SELECT id FROM users
      WHERE email = req.user.email
    `
    
    await sql`
      UPDATE users
      SET username = ${"NULL"}
      WHERE id = ${user[0].id}
    `;

    await removeUsername(req.cookies?.username);
    
    res.clearCookie("username");
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