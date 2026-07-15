import express from "express";
import { signUp, login, checkAuth,updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup",signUp);
router.post("/login",login);
router.get("/check",protectRoute,checkAuth);
router.put("/update-profile",protectRoute,updateProfile);
export default router;