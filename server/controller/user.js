import bcrypt from "bcrypt"
import sql from "../db/postgres.js";

export async function handleSignup(req, res){
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

    return res
      .status(201)
      .cookie("uid", private_key)
      .json({ message: "User created", anion_key: private_key });

  } catch (err) {
    console.error("Signup error:", err);
    return res
    .status(500)
    .json({ message: "Server error" });
  }
}

export async function handleLogin(req, res){
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

  console.log(user);  

  const validPassword = await bcrypt.compare(password, user.password);
  const validUser = await bcrypt.compare(email + password, user.private_key);

  if(!validUser || !validPassword){
    return res
    .status(401)
    .json({message: "Invalid user credentials"});
  }

  return res
  .status(200)
  .cookie("uid", user.private_key)
  .json({message: "Login Successful"})
};
