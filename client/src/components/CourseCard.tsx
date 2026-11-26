import { Link } from "react-router-dom";
import { PlayCircleIcon, UsersIcon } from "lucide-react";
import type { Course } from "../types";
import { formatPrice, plural } from "../config/format";
import Thumb from "./Thumb.tsx";
import LectureBar from "./LectureBar.tsx";

function CourseCard({ course }: { course: Course }) {
    const total = course.lectures.length;
    const free = course.lectures.filter((l) => l.freePreview).length;

    return (
        <Link
            to={`/courses/${course._id}`}
            className="group panel flex h-full flex-col overflow-hidden transition-colors hover:border-primary/60"
        >
            <div className="relative">
                <Thumb
                    src={course.thumbnail}
                    alt=""
                    className="aspect-video w-full"
                />
                <span className="absolute left-3 top-3 rounded-full bg-page/85 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
                    {course.level}
                </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <p className="text-sm font-medium text-primary">
                    {course.category}
                </p>
                <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary-hover">
                    {course.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                    {course.instructorName}
                </p>

                <div className="mt-auto pt-5">
                    <LectureBar
                        total={total}
                        lit={free}
                        size="sm"
                        label={`${plural(total, "lecture")}, ${free} free to preview`}
                    />
                    <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <PlayCircleIcon className="size-4" />
                                {plural(total, "lecture")}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <UsersIcon className="size-4" />
                                {course.enrolledStudents.length}
                            </span>
                        </div>
                        <span
                            className={`font-display text-lg font-bold ${
                                course.price > 0 ? "text-ink" : "text-accent"
                            }`}
                        >
                            {formatPrice(course.price)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default CourseCard;
