import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    getProgress,
    toggleLecture,
} from "../controllers/progressController.js";

const progressRouter = express.Router();

progressRouter.get("/:courseId", requireAuth, getProgress);
progressRouter.post("/:courseId/toggle", requireAuth, toggleLecture);

export default progressRouter;
