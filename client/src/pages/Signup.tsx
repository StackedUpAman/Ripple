import React, { useState, useEffect } from "react";
import axios from "axios";

import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { cn } from "../utilities/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,  
} from "@tabler/icons-react";

import { Link, useNavigate } from "react-router-dom";
import { initSocket } from "../utilities/socket";

export default function SignupForm() {
  const navigate = useNavigate();

  useEffect(() => {  
    document.title = 'Signup';
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [ErrorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    try {
      if (!email.endsWith("@nitk.edu.in")) {
        setStatus("invalid");
        setErrorMsg("Invalid email.");
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await axios.post(
        `${apiBase}/auth/signup`,
        {
          email,
          password,
          confirmPassword,
        },
        {
          withCredentials: true,
        }
      );

      const token = res.data.token;
      if (!token) throw new Error("No token received");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      initSocket(token);
      setStatus("success");
      setTimeout(() => {
        navigate("/chat");
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="w-full max-w-md p-4 mx-auto mt-4 mb-4 bg-white rounded-r-md-none border- shadow-input md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Ripple
      </h2>
      <p className="max-w-sm mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Login to Ripple and start your conversation
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        {/* Email */}
        <LabelInputContainer>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="yourname@nitk.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label htmlFor="password">Enter Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Label htmlFor="password">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-Enter Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </LabelInputContainer>

        <button
          className="group/btn mt-4 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-60 dark:bg-zinc-800"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Processing..." : "Sign Up →"}
          <BottomGradient />
        </button>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex justify-between">
          <p className="mb-3 text-sm font-medium leading-none text-black dark:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Already have an account?
          </p>
          <button>
            <p className="mb-3 text-sm font-medium leading-none text-black dark:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Link to={"/login"}>Login</Link>
            </p>
          </button>
        </div>
        <div className="mt-4 text-sm">
          {status === "success" && (
            <p className="text-green-600">
              Account created successfully! Redirecting...
            </p>
          )}
          {status === "invalid" && (
            <p className="text-yellow-600">
              Only @nitk.edu.in emails are allowed
            </p>
          )}
          {status === "error" && <p className="text-red-600">{ErrorMsg}</p>}
        </div>
      </form>
    </div>
  );
}


const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 block w-full h-px transition duration-500 opacity-0 -bottom-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent group-hover/btn:opacity-100" />
      <span className="absolute block w-1/2 h-px mx-auto transition duration-500 opacity-0 inset-x-10 -bottom-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
