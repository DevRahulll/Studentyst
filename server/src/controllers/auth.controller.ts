import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware.js";

const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET_KEY || "fallback_secret",
        {
            expiresIn: "1d",
        },
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    res.status(statusCode).json({
        success: true,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                message: "Please provide all required fields",
            });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                message: "Email already in use",
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role === "instructor" ? "instructor" : "student",
        });

        sendTokenResponse(user, 201, res);
    } catch (error: any) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (email || !password) {
            res.status(400).json({
                message: "Please provide all email and password",
            });
            return;
        }

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({
                message: "Invalid email or password",
            });
            return;
        }

        sendTokenResponse(user, 200, res);
    } catch (error: any) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getProfile = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.findById(req.user?.id).select("-password");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json({ success: true, user });
    } catch (error) {}
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
    });

    res.json({ success: true, message: "Logged out succesfully" });
};
