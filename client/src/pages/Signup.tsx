"use client";

import React, { useState } from "react";
import bcrypt from "bcryptjs";
import axios from "axios";

import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { cn } from "../utilities/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,  
} from "@tabler/icons-react";

import { Link } from "react-router-dom";

import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { generatePrivateKey } from "../utilities/Hashing";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    try {
      if (!email.endsWith("@nitk.edu.in")) {
        setStatus("invalid");
        return;
      }

      const hashed_pass = await bcrypt.hash(password, 10);

      const private_key = await generatePrivateKey(
        email,
        hashed_pass,
        10
      );

      // sending details to backend
      const res = await axios.post(
        "http://localhost:4000/api/signup",
        {
          email,
          password: hashed_pass,
          private_key,
        },
        {
          withCredentials: true,
        }
      );

      console.log(res.data.msg);
      setStatus("success");
    } catch (err) {
      console.error("Signup error:", err);
      setStatus("error");
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </LabelInputContainer>

        <button
          className="group/btn mt-4 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-60 dark:bg-zinc-800"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing Up..." : "Sign Up →"}
          <BottomGradient />
        </button>
              
        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
            
            <div className="flex justify-between">
                <p className = "mb-3 text-sm font-medium leading-none text-black dark:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Already have an account? 
                </p>
                <button>
                  <p 
                    className = "mb-3 text-sm font-medium leading-none text-black dark:text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"                                                                                                                                                                 
                  >               
                    <Link to={"/login"}>
                      Login     
                    </Link>
                                                 
                  </p>
                </button>
              </div>
            
            <div className="flex flex-col space-y-4">
              <button
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                type="submit"
              >
                <IconBrandGithub className="w-4 h-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  GitHub
                </span>
                <BottomGradient />
              </button>
              <button
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                type="submit"
              >
                <IconBrandGoogle className="w-4 h-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Google
                </span>
              <BottomGradient />
              </button>          
            </div>

        <div className="mt-4 text-sm">
          {status === "success" && (
            <p className="text-green-600">Account created successfully</p>
          )}
          {status === "invalid" && (
            <p className="text-yellow-600">
              Only @nitk.edu.in emails are allowed
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600">
              Signup failed. Check console.
            </p>
          )}
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
