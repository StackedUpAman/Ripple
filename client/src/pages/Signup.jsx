import { useState } from "react";
import bcrypt from "bcryptjs";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
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

      // sending hashed password to server
      const res = await fetch("http://localhost:4000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: hashed_pass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Signup failed");

      setStatus("success");
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
