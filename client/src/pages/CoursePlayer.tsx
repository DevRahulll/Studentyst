import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Course } from "../types";
import { api } from "../config/api";
import toast from "react-hot-toast";
import {
    EmptyState,
    ErrorState,
    FullPageSpinner,
    Spinner,
} from "../components/ui";
import AuthGate from "../components/AuthGate";
import {
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LockIcon,
    PartyPopperIcon,
    Volume2Icon,
} from "lucide-react";
import LectureBar from "../components/LectureBar";
import { plural } from "../config/format";

type Status = "loading" | "ready" | "locked" | "missing" | "error";

function CoursePlayer() {
    const { id } = useParams();
    const [params, setParams] = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [completed, setCompleted] = useState<string[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [autoplay, setAutoplay] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    // refs let the video ended handler see the latest values
    const completedRef = useRef<string[]>([]);
    const initialLecture = useRef(params.get("lecture"));

    useEffect(() => {
        if (authLoading || !user) return;
        let ignore = false;

        const load = async () => {
            try {
                const { data } = await api.get(`/api/courses/${id}`);
                if (ignore) return;
                const loaded: Course = data.course;
                setCourse(loaded);
                if (!data.isEnrolled && !data.isInstructor) {
                    setStatus("locked");
                    return;
                }

                //only ask for progress once we know the user may watch
                const res = await api.get(`/api/progress/${id}`);
                if (ignore) return;
                const done: string[] =
                    res.data.progress?.completedLectures ?? [];
                completedRef.current = done;
                setCompleted(done);

                const start =
                    loaded.lectures.find(
                        (l) => l._id === initialLecture.current,
                    ) ??
                    loaded.lectures.find((l) => !done.includes(l._id)) ??
                    loaded.lectures[0];
                setCurrentId(start?._id ?? null);
                setStatus("ready");
            } catch (error: any) {
                if (ignore) return;
                if (error.statusCode === 404) setStatus("missing");
                else {
                    setError(error);
                    setStatus("error");
                }
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, [id, user, authLoading, attempt]);

    const toggle = useCallback(
        async (lectureId: string) => {
            const before = completedRef.current;
            const after = before.includes(lectureId)
                ? before.filter((x) => x !== lectureId)
                : [...before, lectureId];
            // update immediately then settle iwth the server says
            completedRef.current = after;
            setCompleted(after);
            setSaving(lectureId);
            try {
                const { data } = await api.post(`/api/progress/${id}/toggle`, {
                    lectureId,
                });
                completedRef.current = data.completedLectures;
                setCompleted(data.completedLectures);
            } catch (err: any) {
                completedRef.current = before;
                setCompleted(before);
                toast.error(err || "Couldn't save your progress");
            } finally {
                setSaving(null);
            }
        },
        [id],
    );

    const enroll = async () => {
        setEnrolling(true);
        try {
            await api.post(`/api/courses/${id}/enroll`);
            toast.success("You're enrolled");
            setStatus("loading");
            setAttempt((n) => n + 1);
        } catch (err: any) {
            toast.error(err || "Could not enroll");
        } finally {
            setEnrolling(false);
        }
    };

    if (authLoading) return <FullPageSpinner />;

    if (!user)
        return (
            <div className="h-full overflow-y-auto">
                <AuthGate
                    title="Sign in to start learning"
                    description="Your lectures and progress are tied to your account."
                />
            </div>
        );

    if (status === "loading") return <FullPageSpinner />;

    if (status === "missing")
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon={<LockIcon className="size-6" />}
                    title="Course not found"
                    action={
                        <Link to="/courses" className="btn-primary">
                            Browse courses
                        </Link>
                    }
                />
            </div>
        );

    if (status === "error")
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

    if (status === "locked" && course)
        return (
            <div className="container-page h-full overflow-y-auto py-20">
                <EmptyState
                    icon={<LockIcon className="size-6" />}
                    title="Enroll to watch this course"
                    description={`"${course.title}" is part of your library once you enroll.`}
                    action={
                        <>
                            <button
                                onClick={enroll}
                                disabled={enrolling}
                                className="btn-primary"
                            >
                                {enrolling && <Spinner className="size-4" />}
                                Enroll now
                            </button>
                            <Link
                                to={`/courses/${course._id}`}
                                className="btn-outline"
                            >
                                View course
                            </Link>
                        </>
                    }
                />
            </div>
        );

    if (!course) return null;

    const lectures = course.lectures;
    if (lectures.length === 0)
        return (
            <div className="container-page h-full overflow-y-auto py-20">
                <EmptyState
                    icon={<LockIcon className="size-6" />}
                    title="No lectures yet"
                    description="The instructor hasn't added any lectures to this course."
                    action={
                        <Link
                            to={`/courses/${course._id}`}
                            className="btn-outline"
                        >
                            Back to course
                        </Link>
                    }
                />
            </div>
        );

    const index = Math.max(
        0,
        lectures.findIndex((l) => l._id === currentId),
    );
    const current = lectures[index];
    const prev = lectures[index - 1];
    const next = lectures[index + 1];
    const doneCount = lectures.filter((l) => completed.includes(l._id)).length;
    const percent = Math.round((doneCount / lectures.length) * 100);
    const isDone = completed.includes(current._id);
    const finished = doneCount === lectures.length;

    const select = (lectureId: string, play = true) => {
        setCurrentId(lectureId);
        setAutoplay(play);
        setParams({ lecture: lectureId }, { replace: true });
    };

    const onEnded = () => {
        if (!completedRef.current.includes(current._id)) toggle(current._id);
        if (next) select(next._id, true);
        else toast.success("That was the last lecture");
    };

    return (
        <div className="grid h-full overflow-y-auto lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
            {/* video + controls */}
            <div className="scroll-thin min-w-0 lg:overflow-y-auto">
                <div className="bg-black">
                    <video
                        key={current._id}
                        src={current.videoUrl}
                        poster={course.thumbnail}
                        controls
                        playsInline
                        autoPlay={autoplay}
                        preload="metadata"
                        onEnded={onEnded}
                        className="mx-auto aspect-video max-h-[68vh] w-full object-contain"
                    />
                </div>

                <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
                    <p className="text-sm text-muted">
                        Lecture {index + 1} of {lectures.length}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {current.title}
                    </h1>
                    <Link
                        to={`/courses/${course._id}`}
                        className="mt-1 inline-block text-sm text-muted hover:text-primary"
                    >
                        {course.title}
                    </Link>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => prev && select(prev._id)}
                            disabled={!prev}
                            className="btn-outline"
                        >
                            <ChevronLeftIcon className="size-4" /> Previous
                        </button>
                        <button
                            onClick={() => toggle(current._id)}
                            disabled={saving === current._id}
                            aria-pressed={isDone}
                            className={
                                isDone
                                    ? "btn-outline border-primary text-primary"
                                    : "btn-primary"
                            }
                        >
                            <CheckIcon className="size-4" strokeWidth={3} />
                            {isDone ? "Completed" : "Mark as complete"}
                        </button>
                        <button
                            onClick={() => next && select(next._id)}
                            disabled={!next}
                            className="btn-outline"
                        >
                            Next <ChevronRightIcon className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* lecture list */}
            <aside className="flex min-h-0 flex-col border-t border-line-soft bg-surface lg:border-l lg:border-t-0">
                <div className="border-b border-line-soft p-5">
                    <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
                        {course.title}
                    </h2>
                    <LectureBar
                        total={lectures.length}
                        lit={doneCount}
                        size="md"
                        className="mt-4"
                        label={`${doneCount} of ${lectures.length} lectures completed`}
                    />
                    <div className="mt-2.5 flex justify-between text-sm">
                        <span className="text-muted">
                            {doneCount} of {plural(lectures.length, "lecture")}
                        </span>
                        <span className="font-semibold">{percent}%</span>
                    </div>
                    {finished && (
                        <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
                            <PartyPopperIcon className="size-5 shrink-0 text-primary" />
                            <p className="min-w-0 flex-1 text-sm font-medium">
                                Course complete
                            </p>
                            <Link
                                to="/my-learning"
                                className="btn-primary btn-sm"
                            >
                                My learning
                            </Link>
                        </div>
                    )}
                </div>

                <ol className="scroll-thin min-h-0 flex-1 lg:overflow-y-auto">
                    {lectures.map((lecture, i) => {
                        const active = lecture._id === current._id;
                        const done = completed.includes(lecture._id);
                        return (
                            <li
                                key={lecture._id}
                                className={`flex items-stretch border-b border-line-soft ${
                                    active
                                        ? "bg-primary/10 shadow-[inset_3px_0_0_var(--color-primary)]"
                                        : ""
                                }`}
                            >
                                <button
                                    onClick={() => toggle(lecture._id)}
                                    disabled={saving === lecture._id}
                                    aria-pressed={done}
                                    aria-label={
                                        done
                                            ? `Mark "${lecture.title}" as not complete`
                                            : `Mark "${lecture.title}" as complete`
                                    }
                                    className="grid w-14 shrink-0 place-items-center"
                                >
                                    <span
                                        className={`grid size-5 place-items-center rounded-full border-2 transition-colors ${
                                            done
                                                ? "border-primary bg-primary text-on-primary"
                                                : "border-faint"
                                        }`}
                                    >
                                        {done && (
                                            <CheckIcon
                                                className="size-3"
                                                strokeWidth={4}
                                            />
                                        )}
                                    </span>
                                </button>
                                <button
                                    onClick={() => select(lecture._id)}
                                    aria-current={active ? "true" : undefined}
                                    className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pr-5 text-left"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={`block truncate text-sm font-medium ${
                                                active ? "text-primary" : ""
                                            }`}
                                        >
                                            {i + 1}. {lecture.title}
                                        </span>
                                        <span className="block text-xs text-muted">
                                            {lecture.duration}
                                        </span>
                                    </span>
                                    {active && (
                                        <Volume2Icon
                                            className="size-4 shrink-0 text-primary"
                                            aria-label="Now playing"
                                        />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </aside>
        </div>
    );
}

export default CoursePlayer;
