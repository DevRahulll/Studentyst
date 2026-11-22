import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.js";
import { uploadMedia } from "../controllers/uploadMedia.controller.js";

const uploadRouter = Router();

uploadRouter.post("/", requireAuth, upload.single("file"), uploadMedia);

export default uploadRouter;
