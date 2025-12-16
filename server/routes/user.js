import express from "express";
const router=express.Router();
import { handleLogin,handleSignup } from "../controller/user.js";

router.post("/signup",handleSignup);

router.post("/login",handleLogin)

export default router;