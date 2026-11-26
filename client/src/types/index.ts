export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Lecture {
    _id: string;
    title: string;
    videoUrl: string;
    duration: string;
    freePreview: boolean;
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    category: string;
    level: Level;
    price: number;
    thumbnail: string;
    instructor: string;
    instructorName: string;
    lectures: Lecture[];
    enrolledStudents: string[];
    createdAt: string;
    updatedAt: string;
}

/** Shape returned by GET /api/courses/my-courses */
export interface EnrolledCourse extends Course {
    progressPercentage: number;
    completedLecturesCount: number;
    isCompleted: boolean;
}

/** Shape returned by GET /api/progress/:courseId */
export interface CourseProgress {
    completedLectures: string[];
    isCompleted: boolean;
    percentage: number;
}
