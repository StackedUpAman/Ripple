// LoginRecommended.jsx
import { useState } from "react";
import bcrypt from "bcryptjs";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setStatus("loading");

    try {
      //hashing password at frontend only
      const saltRounds = 10;
      const hashed_pass = await bcrypt.hash(password, saltRounds);

      if (!email.endsWith("@nitk.edu.in")) {
        setStatus("invalid");
        return;
      }
      //sending details to the backend
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      const valid = await bcrypt.compare(password, data.hashed_pass);
      if (valid) {
        setStatus("success");
      }
      else{setStatus("error")}
      // localStorage.setItem("token", data.token);
    } catch (err) {
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
