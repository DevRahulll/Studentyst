import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { connectToDB } from "./src/config/db.js";

const port = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//db
connectToDB();

app.get("/", (req: Request, res: Response) => {
    res.send("Server is Live!");
});

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
