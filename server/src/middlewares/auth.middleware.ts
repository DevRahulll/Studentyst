import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: "student" | "instructor" | "admin";
    };
}

export const requireAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void => {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY || "fallback_secret",
        ) as {
            id: string;
            role: "student" | "instructor" | "admin";
        };

        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired session token" });
    }
};

export const requireInstructor = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void => {
    if (
        !req.user ||
        (req.user.role !== "instructor" && req.user.role !== "admin")
    ) {
        res.status(403).json({ message: "Instructor access required" });
        return;
    }
    next();
};

export const softAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void => {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY || "fallback_secret",
        ) as {
            id: string;
            role: "student" | "instructor" | "admin";
        };
        req.user = decoded;
    } catch {
        //ignore invalid token for softAuth
    }

    next();
};
