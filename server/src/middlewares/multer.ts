import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500mb max for singl video
});

export default upload;
