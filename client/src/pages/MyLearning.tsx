import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../config/api";
import AuthGate from "../components/AuthGate";
import type { EnrolledCourse } from "../types";
import { plural } from "../config/format";
import { EmptyState, ErrorState } from "../components/ui";
import { BookOpenIcon } from "lucide-react";
import { Link } from "react-router-dom";
import LectureBar from "../components/LectureBar";
import Thumb from "../components/Thumb";

type Tab = "all" | "progress" | "done";

function MyLearning() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<EnrolledCourse[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [tab, setTab] = useState<Tab>("all");

    useEffect(() => {
        if (!user) return;
        let ignore = false;
        api.get("/api/courses/my-courses")
            .then((res) => {
                if (ignore) return;
                setCourses(res.data.courses);
                setError(null);
            })
            .catch((err) => !ignore && setError(err));

        return () => {
            ignore = true;
        };
    }, [user, attempt]);

    const counts = useMemo(() => {
        const list = courses ?? [];
        const done = list.filter((c) => c.isCompleted).length;
        return { all: list.length, done, progress: list.length - done };
    }, [courses]);

    const visible = useMemo(() => {
        const list = courses ?? [];
        if (tab === "done") return list.filter((c) => c.isCompleted);
        if (tab === "progress") return list.filter((c) => !c.isCompleted);
        return list;
    }, [courses, tab]);

    if (authLoading) return null;

    if (!user)
        return (
            <AuthGate
                title="Sign in to see your courses"
                description="Courses you enroll in and your progress through them, live here."
            />
        );

    const tabs: { value: Tab; label: string; count: number }[] = [
        { value: "all", label: "All", count: counts.all },
        { value: "progress", label: "In progress", count: counts.progress },
        { value: "done", label: "Completed", count: counts.done },
    ];

    return (
        <div className="container-page py-10 lg:py-14">
            <h1 className="font-display text-5xl font-extrabold font-stretch-78% sm:text-6xl">
                My learning
            </h1>
            <p className="mt-2 text-muted">
                {courses === null
                    ? "Loading your courses"
                    : counts.all === 0
                      ? "You haven't enrolled in anything yet"
                      : `${plural(counts.all, "course")} enrolled, ${counts.done} completed`}
            </p>

            {courses && counts.all > 0 && (
                <div className="mt-8 flex flex-wrap gap-2" role="tablist">
                    {tabs.map((t) => (
                        <button
                            key={t.value}
                            role="tab"
                            aria-selected={tab === t.value}
                            onClick={() => setTab(t.value)}
                            className={`chip ${tab === t.value ? "chip-active" : ""}`}
                        >
                            {t.label}
                            <span className="text-xs opacity-70">
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-8 space-y-4">
                {error ? (
                    <ErrorState
                        message={error}
                        onRetry={() => setAttempt((n) => n + 1)}
                    />
                ) : courses === null ? (
                    Array.from({ length: 3 }, (_, i) => (
                        <div
                            key={i}
                            className="panel grid gap-5 p-4 sm:grid-cols-[220px_1fr]"
                        >
                            <div className="skeleton aspect-video" />
                            <div className="space-y-3 py-2">
                                <div className="skeleton h-3 w-24" />
                                <div className="skeleton h-6 w-2/3" />
                                <div className="skeleton mt-6 h-2 w-full" />
                            </div>
                        </div>
                    ))
                ) : counts.all === 0 ? (
                    <EmptyState
                        icon={<BookOpenIcon className="size-6" />}
                        title="Your library is empty"
                        description="Enroll in a course and it will show up here with your progress."
                        action={
                            <Link to="/courses" className="btn-primary">
                                Browse courses
                            </Link>
                        }
                    />
                ) : visible.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
                        {tab === "done"
                            ? "You haven't finished a course yet. Keep going."
                            : "Nothing in progress. Every course you enrolled in is complete."}
                    </p>
                ) : (
                    visible.map((c) => {
                        const total = c.lectures.length;
                        return (
                            <article
                                key={c._id}
                                className="panel grid gap-5 p-4 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-center"
                            >
                                <Link
                                    to={`/courses/${c._id}`}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    <Thumb
                                        src={c.thumbnail}
                                        alt=""
                                        className="aspect-video w-full rounded-lg"
                                    />
                                </Link>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-primary">
                                        {c.category}
                                    </p>
                                    <h2 className="mt-0.5 line-clamp-2 text-xl font-semibold leading-snug">
                                        <Link
                                            to={`/courses/${c._id}`}
                                            className="hover:text-primary-hover"
                                        >
                                            {c.title}
                                        </Link>
                                    </h2>
                                    <p className="text-sm text-muted">
                                        {c.instructorName}
                                    </p>
                                    <LectureBar
                                        total={total}
                                        lit={c.completedLecturesCount}
                                        className="mt-4"
                                        label={`${c.completedLecturesCount} of ${total} lectures completed`}
                                    />
                                    <div className="mt-2 flex justify-between text-sm">
                                        <span className="text-muted">
                                            {c.completedLecturesCount} of{" "}
                                            {plural(total, "lecture")}
                                        </span>
                                        <span className="font-semibold">
                                            {c.isCompleted
                                                ? "Completed"
                                                : `${c.progressPercentage}%`}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to={`/learn/${c._id}`}
                                    className={
                                        c.isCompleted
                                            ? "btn-outline"
                                            : "btn-primary"
                                    }
                                >
                                    {c.isCompleted
                                        ? "Review"
                                        : c.completedLecturesCount > 0
                                          ? "Continue"
                                          : "Start course"}
                                </Link>
                            </article>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default MyLearning;
