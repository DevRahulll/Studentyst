import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Course } from "../types";
import { api } from "../config/api";
import toast from "react-hot-toast";
import AuthGate from "../components/AuthGate";
import { EmptyState, ErrorState } from "../components/ui";
import {
    EyeIcon,
    PencilIcon,
    PlusIcon,
    Trash2Icon,
    VideoIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate, formatPrice, plural } from "../config/format";
import Thumb from "../components/Thumb";
import ConfirmDialog from "../components/ConfirmDialog";

const columns = "md:grid-cols-[minmax(0,1fr)_84px_84px_84px_120px_112px]";

function InstructorPanel() {
    const { user, loading: authLoading, isInstructor } = useAuth();
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [toDelete, setToDelete] = useState<Course | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user || !isInstructor) return;
        let ignore = false;
        api.get("/api/courses/instructor")
            .then((res) => {
                console.log(res);
                if (ignore) return;
                setCourses(res.data.courses);
                setError(null);
            })
            .catch((err) => !ignore && setError(err));

        return () => {
            ignore = true;
        };
    }, [user, isInstructor, attempt]);

    const totals = useMemo(() => {
        const list = courses ?? [];
        return {
            students: list.reduce((n, c) => n + c.enrolledStudents.length, 0),
            lectures: list.reduce((n, c) => n + c.lectures.length, 0),
        };
    }, [courses]);

    const confirmDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/api/courses/${toDelete._id}`);
            setCourses((list) =>
                (list ?? []).filter((c) => c._id !== toDelete._id),
            );
            toast.success("Course deleted");
            setToDelete(null);
        } catch (err: any) {
            toast.error(err?.message);
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading) return null;

    if (!user) {
        return (
            <AuthGate
                title="Sign in to manage your courses"
                description="The instructor panel is where you create, edit and publish courses."
            />
        );
    }

    if (!isInstructor)
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon={<VideoIcon className="size-6" />}
                    title="This area is for instructors"
                    description="Your account is a student account. Instructor accounts are chosen when signing up, so you'd need to register a new account to teach."
                    action={
                        <Link to="/courses" className="btn-primary">
                            Browse courses
                        </Link>
                    }
                />
            </div>
        );

    return (
        <div className="container-page py-10 lg:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-5xl font-extrabold font-stretch-78% sm:text-6xl">
                        Your courses
                    </h1>
                    <p className="mt-2 text-muted">
                        {courses === null
                            ? "Loading your courses"
                            : `${plural(courses.length, "course")}, ${plural(totals.lectures, "lecture")}, ${plural(totals.students, "student")} enrolled`}
                    </p>
                </div>
                <Link to="/intructor/editor" className="btn-primary btn-lg">
                    <PlusIcon className="size-5" />
                    New course
                </Link>
            </div>

            <div className="mt-10">
                {error ? (
                    <ErrorState
                        message={error}
                        onRetry={() => setAttempt((n) => n + 1)}
                    />
                ) : courses === null ? (
                    <div className="panel divide-y divide-line-soft">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4"
                            >
                                <div className="skeleton h-16 w-28" />
                                <div className="skeleton h-5 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <EmptyState
                        icon={<VideoIcon className="size-6" />}
                        title="You haven't created a course yet"
                        description="Add a title, a thumbnail and your first lectures. You can keep editing after you save."
                        action={
                            <Link
                                to="/intructor/editor"
                                className="btn-primary"
                            >
                                Create your first course
                            </Link>
                        }
                    />
                ) : (
                    <div className="panel overflow-hidden">
                        <div
                            className={`hidden gap-4 border-b border-line bg-raised/60 px-5 py-3 text-sm font-medium text-muted md:grid ${columns}`}
                        >
                            <span>Course</span>
                            <span>Price</span>
                            <span>Lectures</span>
                            <span>Students</span>
                            <span>Updated</span>
                            <span className="text-right">Actions</span>
                        </div>
                        <ul className="divide-y divide-line-soft">
                            {courses.map((c) => (
                                <li
                                    key={c._id}
                                    className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 md:grid md:gap-x-4 ${columns}`}
                                >
                                    <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
                                        <Thumb
                                            src={c.thumbnail}
                                            alt=""
                                            className="aspect-video w-28 shrink-0 rounded-md"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">
                                                {c.title}
                                            </p>
                                            <p className="text-sm text-muted">
                                                {c.category}, {c.level}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">
                                        <span className="mr-1.5 text-faint md:hidden">
                                            Price
                                        </span>
                                        {formatPrice(c.price)}
                                    </span>
                                    <span className="text-sm">
                                        <span className="mr-1.5 text-faint md:hidden">
                                            Lectures
                                        </span>
                                        {c.lectures.length}
                                    </span>
                                    <span className="text-sm">
                                        <span className="mr-1.5 text-faint md:hidden">
                                            Students
                                        </span>
                                        {c.enrolledStudents.length}
                                    </span>
                                    <span className="text-sm text-muted">
                                        {formatDate(c.updatedAt)}
                                    </span>
                                    <div className="ml-auto flex items-center justify-end gap-1">
                                        <Link
                                            to={`/courses/${c._id}`}
                                            className="btn-ghost size-9 p-0!"
                                            aria-label={`View ${c.title}`}
                                            title="View"
                                        >
                                            <EyeIcon className="size-4" />
                                        </Link>
                                        <Link
                                            to={`/intructor/editor/${c._id}`}
                                            className="btn-ghost size-9 p-0!"
                                            aria-label={`Edit ${c.title}`}
                                            title="Edit"
                                        >
                                            <PencilIcon className="size-4" />
                                        </Link>
                                        <button
                                            onClick={() => setToDelete(c)}
                                            className="btn-ghost size-9 p-0! hover:bg-bad/15! hover:text-bad!"
                                            aria-label={`Delete ${c.title}`}
                                            title="Delete"
                                        >
                                            <Trash2Icon className="size-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* confimation */}
            <ConfirmDialog
                open={toDelete !== null}
                title="Delete this course?"
                message={`"${toDelete?.title ?? ""}" will be removed for good, along with every student's progress in it.`}
                confirmLabel="Delete course"
                busy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => !deleting && setToDelete(null)}
            />
        </div>
    );
}

export default InstructorPanel;
