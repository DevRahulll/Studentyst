import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { Progress } from "../models/courseProgress.js";

export const getAllCourses = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const { search, category, level } = req.query;
        const filter: any = {};

        if (search) {
            filter.$or = [
                { title: { $regex: String(search), $options: "i" } },
                { description: { $regex: String(search), $options: "i" } },
            ];
        }

        if (category && category !== "All") {
            filter.category = category;
        }

        if (level && level !== "All") {
            filter.level = level;
        }

        const courses = await Course.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, courses });
    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getCourseById = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        const userId = req.user?.id;
        const isEnrolled = userId
            ? course.enrolledStudents.some((id) => id.toString() === userId)
            : false;

        const isIntructor = userId
            ? course.instructor.toString() === userId
            : false;
        res.json({
            success: true,
            course,
            isEnrolled,
            isIntructor,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const {
            title,
            description,
            category,
            level,
            price,
            thumbnail,
            lectures,
        } = req.body;
        if (!title || !description || !thumbnail) {
            res.status(400).json({
                message: "Title, description and thubnail is required",
            });
            return;
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            res.status(404).json({ message: "Instructor not found" });
        }

        const course = await Course.create({
            title,
            description,
            category: category || "Development",
            level: level || "Beginner",
            price: Number(price) || 0,
            thumbnail,
            instructor: user?.id,
            instructorName: user?.name,
            lectures: lectures || [],
            enrolledStudents: [],
        });

        res.status(201).json({ success: true, course });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        if (
            course.instructor.toString() !== req.user?.id &&
            req.user?.role !== "admin"
        ) {
            res.status(404).json({ message: "Unauthroized to access" });
        }

        Object.assign(course, req.body);
        await course.save();

        res.status(200).json({ success: true, course });
    } catch (error: any) {
        res.status(500).json({
            message: error.message || "Failed to update course",
        });
    }
};

export const deleteCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ message: "Course not Found" });
            return;
        }

        if (
            course.instructor.toString() !== req.user?.id &&
            req.user?.id !== "admin"
        ) {
            res.status(403).json({ message: "Unauthorized to do actions" });
            return;
        }

        await Course.findByIdAndDelete(req.params.id);
        await Progress.deleteMany({ course: req.params.id });

        res.json({ success: true, message: "Course deleted successfully" });
    } catch (error: any) {
        res.status(500).json({
            message: error.message || "Failed to delete course",
        });
    }
};

export const enrollCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            res.status(404).json({ message: "Course not Found" });
            return;
        }

        const userId = req.user?.id;
        const alreadyEnrolled = course.enrolledStudents.some(
            (id) => id.toString() === userId,
        );

        if (!alreadyEnrolled) {
            course.enrolledStudents.push(userId as any);
            await course.save();

            //create intiail progress tracker if not already prsent
            (await Progress.findOneAndUpdate({
                user: userId,
                course: course._id,
            }),
                { $setOnInsert: { completedLectures: [], isCompleted: false } },
                { upsert: true });
        }

        res.json({
            success: true,
            message: "Enrolled successfully",
            courseId: course._id,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyEnrolledCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const courses = await Course.find({ enrolledStudents: userId }).sort({
            updatedAt: -1,
        });

        const progressList = await Progress.find({
            user: userId,
            course: { $in: courses.map((c) => c._id) },
        });

        const progressMap = new Map(
            progressList.map((p) => [p.course.toString(), p]),
        );

        const results = courses.map((course) => {
            const progress = progressMap.get(course._id.toString());
            const completedCount = progress?.completedLectures?.length || 0;
            const totalLectures = course.lectures.length || 1;
            const percentage = Math.min(
                100,
                Math.round((completedCount / totalLectures) * 100),
            );
            const isCompleted = Boolean(
                progress?.isCompleted ||
                (course.lectures.length > 0 &&
                    completedCount >= course.lectures.length),
            );

            return {
                ...course.toObject(),
                progressPercentage: percentage,
                completedLecturesCount: completedCount,
                isCompleted,
            };
        });

        res.json({ success: true, courses: results });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getIntructorCourse = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const courses = await Course.find({ instructor: req.user?.id }).sort({
            createdAt: -1,
        });
        res.json({ success: true, courses });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
