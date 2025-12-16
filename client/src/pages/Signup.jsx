import { useState } from "react";
import bcrypt from "bcryptjs";
import axios from "axios";
import { generatePrivateKey } from "../utilities/Hashing";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    try {

      //verifying nitk.edu id
      if (!email.endsWith("@nitk.edu.in")) {
        setStatus("invalid");
        return;
      }


      //hashing password 
      const saltRounds = 10;
      const hashed_pass = await bcrypt.hash(password, saltRounds);


      //generating private key
      const private_key=await generatePrivateKey(email,hashed_pass,10)

      //sending details to the backend
      const res = await axios.post(
        "http://localhost:4000/api/signup",
        {
          email,
          password:hashed_pass,
          private_key
        },
        {
          withCredentials: true,
        }
      );


      const data = res.data;
      setStatus("success");
      console.log(data.msg);
    } catch (err) {
      console.error("Signup error:", err);
      setStatus("error");
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Hashing..." : "Create Account"}
        </button>

        {status === "success" && <p>Account created!</p>}
        {status === "invalid" && <p>Invalid domain name</p>}
        {status === "error" && <p>Signup failed. Check console.</p>}
      </form>
    </div>
  );
}

export default Signup;
