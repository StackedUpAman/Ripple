import { useState } from "react";
import bcrypt from "bcryptjs";
import axios from "axios";
import { generatePrivateKey } from "../utilities/Hashing";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setStatus("loading");

    try {
      if (!email.endsWith("@nitk.edu.in")) {
        setStatus("invalid");
        return;
      }


      //hashing password
      const saltRounds = 10;
      const hashed_pass = await bcrypt.hash(password, saltRounds);

      //generating private key to store in cookies
      const private_key= await generatePrivateKey(email,hashed_pass,10)

      //sending details to the backend
      const res = await axios.post(
        "http://localhost:4000/api/login",
        {
          email,
          password:hashed_pass,
          private_key,
        },
        {
          withCredentials: true,
        }
      );

      //Displaying the backend validation
      const data =res.data;
      const valid = data.valid;

      if (valid) {
        setStatus("success");
      } else {
        setStatus("error");
      }

    } catch (err) {
      console.log("Error:",err)
      setStatus("error");
    }
  }

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Login"}
        </button>

        {status === "success" && <p>Login successful!</p>}
        {status === "invalid" && <p>Invalid domain name</p>}
        {status === "error" && <p>Invalid email or password</p>}
      </form>
    </div>
  );
}

export default Login;
