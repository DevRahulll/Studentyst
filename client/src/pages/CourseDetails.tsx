import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { type Course, type Lecture } from "../types";
import { api } from "../config/api";
import toast from "react-hot-toast";
import {
    EmptyState,
    ErrorState,
    FullPageSpinner,
    Spinner,
} from "../components/ui";
import {
    BarChart3Icon,
    ClockIcon,
    LockIcon,
    PlayCircleIcon,
    PlayIcon,
    UsersIcon,
    VideoIcon,
} from "lucide-react";
import {
    formatDate,
    formatPrice,
    formatTotalDuration,
    initials,
    plural,
} from "../config/format";
import Thumb from "../components/Thumb";
import LectureBar from "../components/LectureBar";
import VideoModal from "../components/VideoModal";

type Status = "loading" | "ready" | "missing" | "error";

function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading, openAuthModal } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [enrolling, setEnrolling] = useState(false);
    const [preview, setPreview] = useState<Lecture | null>(null);

    useEffect(() => {
        if (authLoading) return;
        let ignore = false;

        const load = async () => {
            try {
                const { data } = await api.get(`/api/courses/${id}`);
                if (ignore) return;

                setCourse(data.course);
                setIsEnrolled(Boolean(data.isEnrolled));
                setIsOwner(Boolean(data.isInstructor));
                setStatus("ready");
            } catch (err: any) {
                if (ignore) return;
                if (err.statusCode === 404) {
                    setStatus("missing");
                    return;
                }
                if (!user) {
                    // This endpoint uses optional auth, but the backend answers
                    // signed-out visitors with an error. The public course list
                    // carries the same details, so use that instead.
                    try {
                        const { data } = await api.get("/api/courses");
                        if (ignore) return;
                        const found = (data.courses as Course[]).find(
                            (c) => c._id === id,
                        );
                        if (found) {
                            setCourse(found);
                            setIsEnrolled(false);
                            setIsOwner(false);
                            setStatus("ready");
                        } else {
                            setStatus("missing");
                        }
                        return;
                    } catch (fallbackErr: any) {
                        if (ignore) return;
                        setError(fallbackErr);
                        setStatus("error");
                        return;
                    }
                }
                setError(err);
                setStatus("error");
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, [id, user, authLoading, attempt]);

    const enroll = useCallback(async () => {
        setEnrolling(true);
        try {
            await api.post(`/api/courses/${id}/enroll`);
            setIsEnrolled(true);
            toast.success("You're enrolled");
            navigate(`/learn/${id}`);
        } catch (err: any) {
            toast.error(err.message || "Could not enroll");
        } finally {
            setEnrolling(false);
        }
    }, [id, navigate]);

    if (status === "loading" || authLoading) return <FullPageSpinner />;

    if (status === "missing")
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon={<VideoIcon className="size-6" />}
                    title="Course not found"
                    description="It may have been removed by its instructor."
                    action={
                        <Link to="/courses" className="btn-primary">
                            Browse courses
                        </Link>
                    }
                />
            </div>
        );

    if (status === "error" || !course)
        return (
            <div className="container-page py-20">
                <ErrorState
                    message={error}
                    onRetry={() => {
                        setStatus("loading");
                        setAttempt((n) => n + 1);
                    }}
                />
            </div>
        );

    const lectures = course.lectures;
    const free = lectures.filter((l) => l.freePreview);
    const canWatch = isEnrolled || isOwner;
    const totalTime = formatTotalDuration(lectures);

    return (
        <div className="container-page py-10 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
                <div className="min-w-0">
                    <nav className="text-sm text-muted">
                        <Link to={"/courses"} className="hover:text-primary">
                            Courses
                        </Link>
                        <span className="mx-2 text-faint">/</span>
                        <Link
                            to={`/courses?category=${encodeURIComponent(course.category)}`}
                            className="hover:text-primary"
                        >
                            {course.category}
                        </Link>
                    </nav>
                    <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] font-stretch-84% sm:text-5xl lg:text-6xl">
                        {course.title}
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2.5">
                            <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                                {initials(course.instructorName)}
                            </span>
                            <div className="leading-tight">
                                <p className="font-medium">
                                    {course.instructorName}
                                </p>
                                <p className="text-xs text-muted">Instructor</p>
                            </div>
                        </div>
                        <span className="rounded-full border border-line px-3 py-1 text-sm text-muted">
                            {course.level}
                        </span>
                        <span className="text-sm text-muted">
                            Updated {formatDate(course.updatedAt)}
                        </span>
                    </div>

                    <section className="mt-12 border-t border-line pt-10">
                        <h2 className="text-2xl font-bold">
                            About this course
                        </h2>
                        <p className="mt-4 max-w-[68ch] whitespace-pre-line text-base/relaxed text-muted">
                            {course.description}
                        </p>
                    </section>

                    <section className="mt-12">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="text-2xl font-bold">Curriculum</h2>
                            <p className="text-sm text-muted">
                                {plural(lectures.length, "lecture")}
                                {totalTime ? `, about ${totalTime}` : ""}
                            </p>
                        </div>

                        {lectures.length === 0 ? (
                            <p className="mt-5 rounded-xl border border-dashed border-line p-6 text-center text-muted">
                                The instructor hasn't added any lectures yet.
                            </p>
                        ) : (
                            <ol className="mt-5 divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-surface">
                                {lectures.map((lecture, i) => (
                                    <li
                                        key={lecture._id}
                                        className="flex items-center gap-4 px-4 py-3.5"
                                    >
                                        <span className="w-6 shrink-0 text-center font-display text-sm font-semibold text-faint">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">
                                                {lecture.title}
                                            </p>
                                            {lecture.freePreview &&
                                                !canWatch && (
                                                    <p className="text-xs font-medium text-accent">
                                                        Free preview
                                                    </p>
                                                )}
                                        </div>
                                        <span className="hidden shrink-0 text-sm text-muted sm:block">
                                            {lecture.duration}
                                        </span>
                                        {canWatch ? (
                                            <Link
                                                to={`/learn/${course._id}?lecture=${lecture._id}`}
                                                className="grid size-9 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/15"
                                                aria-label={`Play ${lecture.title}`}
                                            >
                                                <PlayCircleIcon className="size-5" />
                                            </Link>
                                        ) : lecture.freePreview ? (
                                            <button
                                                onClick={() =>
                                                    setPreview(lecture)
                                                }
                                                className="btn-outline btn-sm shrink-0"
                                            >
                                                Preview
                                            </button>
                                        ) : (
                                            <span
                                                className="grid size-9 shrink-0 place-items-center text-faint"
                                                title="Enroll to unlock"
                                            >
                                                <LockIcon className="size-4" />
                                                <span className="sr-only">
                                                    Locked
                                                </span>
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>

                {/* enroll cars */}
                <aside className="lg:order-last">
                    <div className="panel overflow-hidden lg:sticky lg:top-24">
                        <div className="relative">
                            <Thumb
                                src={course.thumbnail}
                                alt=""
                                eager
                                className="aspect-video w-full"
                            />
                            {free[0] && !canWatch && (
                                <button
                                    onClick={() => setPreview(free[0])}
                                    className="group absolute inset-0 grid place-items-center bg-black/35"
                                    aria-label="Watch the free preview"
                                >
                                    <span className="grid size-14 place-items-center rounded-full bg-primary text-on-primary transition-transform group-hover:scale-105">
                                        <PlayIcon className="size-6 fill-current" />
                                    </span>
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            <p
                                className={`font-display text-4xl font-extrabold ${
                                    course.price > 0 ? "" : "text-accent"
                                }`}
                            >
                                {formatPrice(course.price)}
                            </p>

                            <div className="mt-5 space-y-3">
                                {isOwner ? (
                                    <>
                                        <Link
                                            to={`/intructor/editor/${course._id}`}
                                            className="btn-primary btn-lg w-full"
                                        >
                                            Edit course
                                        </Link>
                                        <Link
                                            to={`/learn/${course._id}`}
                                            className="btn-outline btn-lg w-full"
                                        >
                                            Open player
                                        </Link>
                                    </>
                                ) : isEnrolled ? (
                                    <Link
                                        to={`/learn/${course._id}`}
                                        className="btn-primary btn-lg w-full"
                                    >
                                        Continue learning
                                    </Link>
                                ) : user ? (
                                    <button
                                        onClick={enroll}
                                        disabled={enrolling}
                                        className="btn-primary btn-lg w-full"
                                    >
                                        {enrolling && (
                                            <Spinner className="size-5" />
                                        )}
                                        Enroll now
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() =>
                                                openAuthModal("login")
                                            }
                                            className="btn-primary btn-lg w-full"
                                        >
                                            Sign in to enroll
                                        </button>
                                        <p className="text-center text-sm text-muted">
                                            New here?{" "}
                                            <button
                                                onClick={() =>
                                                    openAuthModal("register")
                                                }
                                                className="font-semibold text-primary hover:text-primary-hover"
                                            >
                                                Create an account
                                            </button>
                                        </p>
                                    </>
                                )}
                            </div>

                            <ul className="mt-6 space-y-3.5 border-t border-line pt-6 text-sm">
                                <li className="flex items-center gap-3 text-muted">
                                    <PlayCircleIcon className="size-4 shrink-0 text-primary" />
                                    {plural(lectures.length, "video lecture")}
                                </li>
                                {totalTime && (
                                    <li className="flex items-center gap-3 text-muted">
                                        <ClockIcon className="size-4 shrink-0 text-primary" />
                                        About {totalTime} of video
                                    </li>
                                )}
                                <li className="flex items-center gap-3 text-muted">
                                    <BarChart3Icon className="size-4 shrink-0 text-primary" />
                                    {course.level} level
                                </li>
                                <li className="flex items-center gap-3 text-muted">
                                    <UsersIcon className="size-4 shrink-0 text-primary" />
                                    {plural(
                                        course.enrolledStudents.length,
                                        "student",
                                    )}{" "}
                                    enrolled
                                </li>
                            </ul>

                            {lectures.length > 0 && (
                                <div className="mt-6">
                                    <LectureBar
                                        total={lectures.length}
                                        lit={free.length}
                                        size="md"
                                        label={`${free.length} of ${lectures.length} lectures free to preview`}
                                    />
                                    <p className="mt-2 text-xs text-muted">
                                        {free.length > 0
                                            ? `${free.length} of ${plural(lectures.length, "lecture")} free to preview`
                                            : "No free previews for this course"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Video */}
            <VideoModal
                open={preview !== null}
                title={preview?.title ?? ""}
                src={preview?.videoUrl ?? ""}
                onClose={() => setPreview(null)}
            />
        </div>
    );
}

export default CourseDetails;
