import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDB } from "./src/config/db.js";
import authRouter from "./src/routes/auth.routes.js";

const port = process.env.PORT || 3000;

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

//db
connectToDB();

app.get("/", (req: Request, res: Response) => {
    res.send("Server is Live!");
});
app.use("/api/auth", authRouter);

//error handler
app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
    console.log(error.message);
    const status = error.statusCode || 500;
    const message = error.message || "internal Server error";

    res.status(error.statusCode || 500).json({ message });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
