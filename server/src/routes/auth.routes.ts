import { Router } from "express";
import {
    getProfile,
    login,
    logout,
    register,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, getProfile);
authRouter.post("/logout", requireAuth, logout);

export default authRouter;
