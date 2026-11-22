import { Router } from "express";
import {
    createCourse,
    deleteCourse,
    enrollCourse,
    getAllCourses,
    getCourseById,
    getIntructorCourse,
    getMyEnrolledCourse,
    updateCourse,
} from "../controllers/course.controller.js";
import {
    requireAuth,
    requireInstructor,
    softAuth,
} from "../middlewares/auth.middleware.js";

const courseRouter = Router();

courseRouter.get("/", getAllCourses);
courseRouter.get("/my-courses", requireAuth, getMyEnrolledCourse);
courseRouter.get(
    "/instructor",
    requireAuth,
    requireInstructor,
    getIntructorCourse,
);
courseRouter.get("/:id", softAuth, getCourseById);

courseRouter.post("/", requireAuth, requireInstructor, createCourse);
courseRouter.put("/:id", requireAuth, requireInstructor, updateCourse);
courseRouter.delete("/:id", requireAuth, requireInstructor, deleteCourse);
courseRouter.post("/:id/enroll", requireAuth, enrollCourse);

export default courseRouter;
