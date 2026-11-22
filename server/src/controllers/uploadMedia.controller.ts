import { Request, Response } from "express";
import { imagekit } from "../config/imagekit.js";

export const uploadMedia = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file provided for upload" });
            return;
        }

        const safeFileName = req.file.originalname.replace(
            /[^a-zA-Z0-9._-]/g,
            "_",
        );

        const result = await imagekit.upload({
            file: req.file.buffer,
            fileName: `${Date.now()}_${safeFileName}`,
            folder: "/lms",
            useUniqueFileName: true,
        });

        const originalUrl =
            result.fileType === "non-image"
                ? `${result.url.replace("/lms/,", "/tr:orig-true/lms/")}`
                : result.url;

        res.json({
            success: true,
            url: originalUrl,
            fileId: result.fileId,
            fileType: result.fileType,
            thumbnailUrl: result.thumbnailUrl || result.url,
        });
    } catch (error: any) {
        console.error("Media upload error:", error.message);
        res.status(500).json({ message: error.message });
    }
};
