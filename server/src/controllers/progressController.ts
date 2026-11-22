import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { Course } from "../models/course.model.js";
import { Progress } from "../models/courseProgress.js";

export const getProgress = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.id;

        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        let progress = await Progress.findOne({
            user: userId as any,
            course: courseId as any,
        });
        if (!progress) {
            progress = await Progress.create({
                user: userId as any,
                course: courseId as any,
                completedLectures: [],
                isCompleted: false,
            });
        }

        const totalLectures = course.lectures.length || 1;
        const percentage = Math.min(
            100,
            Math.round(
                (progress.completedLectures.length / totalLectures) * 100,
            ),
        );

        res.json({
            success: true,
            progress: {
                completedLectures: progress.completedLectures,
                isCompleted: progress.isCompleted,
                percentage,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleLecture = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.id;
        const { lectureId } = req.body;

        if (!lectureId) {
            res.status(404).json({ message: "LectureId not found" });
            return;
        }

        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        let progress = await Progress.findOne({
            user: userId as any,
            course: courseId as any,
        });
        if (!progress) {
            progress = new Progress({
                user: userId as any,
                course: courseId as any,
                completedLectures: [],
            });
        }

        const index = progress.completedLectures.indexOf(lectureId);
        if (index > -1) {
            progress.completedLectures.splice(index, 1);
        } else {
            progress.completedLectures.push(lectureId);
        }

        const totalLectures = course.lectures.length;
        progress.isCompleted =
            totalLectures > 0 &&
            progress.completedLectures.length >= totalLectures;
        await progress.save();

        const percentage =
            totalLectures > 0
                ? Math.min(
                      100,
                      Math.round(
                          (progress.completedLectures.length / totalLectures) *
                              100,
                      ),
                  )
                : 0;

        res.json({
            success: true,
            completedLectures: progress.completedLectures,
            isCompleted: progress.isCompleted,
            percentage,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
