import express from "express";
const router=express.Router();
import { handleLogin,handleLogout,handleSignup } from "../controller/user.controller.js";

router.post("/signup",handleSignup);
router.post("/login",handleLogin);
router.post("/logout",handleLogout);

export default router;