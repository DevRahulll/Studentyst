import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlayIcon, SearchIcon, VideoIcon } from "lucide-react";
import { api } from "../config/api";
import { plural } from "../config/format";
import { useAuth } from "../context/AuthContext";
import type { Course } from "../types";
import CourseCard from "../components/CourseCard";
import LectureBar from "../components/LectureBar";
import Thumb from "../components/Thumb";
import { CourseCardSkeleton, EmptyState, ErrorState } from "../components/ui";

function FeaturedCourse({ course }: { course: Course }) {
    const total = course.lectures.length;
    const free = course.lectures.filter((l) => l.freePreview).length;
    return (
        <Link
            to={`/courses/${course._id}`}
            className="hero-in group block rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-primary/60"
            style={{ animationDelay: "250ms" }}
        >
            <div className="relative overflow-hidden rounded-xl">
                <Thumb
                    src={course.thumbnail}
                    alt=""
                    eager
                    className="aspect-video w-full"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                    <span className="grid size-16 place-items-center rounded-full bg-primary text-on-primary transition-transform group-hover:scale-105">
                        <PlayIcon className="size-7 fill-current" />
                    </span>
                </span>
            </div>
            <div className="px-3 pb-3 pt-5">
                <p className="text-sm font-medium text-accent">Newest course</p>
                <h2 className="mt-1 line-clamp-2 text-2xl font-bold leading-tight">
                    {course.title}
                </h2>
                <p className="mt-1 text-muted">with {course.instructorName}</p>
                <LectureBar
                    total={total}
                    lit={free}
                    size="lg"
                    animate
                    className="mt-6"
                    label={`${plural(total, "lecture")}, ${free} free to preview`}
                />
                <p className="mt-3 text-sm text-muted">
                    {free > 0
                        ? `${free} of ${plural(total, "lecture")} free to preview`
                        : plural(total, "lecture")}
                </p>
            </div>
        </Link>
    );
}

const steps = [
    {
        title: "Find a course",
        text: "Search by topic or filter by category and level. Free preview lectures let you try a course before you enroll.",
    },
    {
        title: "Enroll",
        text: "Enrolling adds the course to My learning, so it's one click away every time you come back.",
    },
    {
        title: "Watch and tick off lectures",
        text: "Mark each lecture complete as you go. Your progress is saved, so you can stop and resume whenever you like.",
    },
];

function Home() {
    const navigate = useNavigate();
    const {
        user,
        loading: authLoading,
        isInstructor,
        openAuthModal,
    } = useAuth();
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [attempt, setAttempt] = useState(0);

    const load = useCallback(() => {
        setError(null);
        setCourses(null);
        setAttempt((n) => n + 1);
    }, []);

    useEffect(() => {
        let ignore = false;
        api.get("/api/courses")
            .then((res) => !ignore && setCourses(res.data.courses))
            .catch((err) => !ignore && setError(err));
        return () => {
            ignore = true;
        };
    }, [attempt]);

    const categories = useMemo(() => {
        const counts = new Map<string, number>();
        (courses ?? []).forEach((c) =>
            counts.set(c.category, (counts.get(c.category) ?? 0) + 1),
        );
        return [...counts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [courses]);

    const onSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
    };

    const featured = courses?.[0];
    const latest = courses?.slice(0, 6) ?? [];

    return (
        <>
            {/* hero */}
            <section className="container-page grid gap-12 pb-16 pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
                <div>
                    <h1 className="hero-in font-display text-[clamp(3.25rem,8vw,6.5rem)] font-extrabold leading-[0.88] tracking-tight font-stretch-76%">
                        Courses you actually finish.
                    </h1>
                    <p
                        className="hero-in mt-7 max-w-lg text-lg text-muted"
                        style={{ animationDelay: "120ms" }}
                    >
                        Watch video lectures at your own pace. Tick off each one
                        as you go and pick up exactly where you stopped.
                    </p>
                    <form
                        onSubmit={onSearch}
                        className="hero-in mt-9 flex max-w-xl gap-2"
                        style={{ animationDelay: "200ms" }}
                        role="search"
                    >
                        <div className="relative flex-1">
                            <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-faint" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search courses, e.g. React or design"
                                aria-label="Search courses"
                                className="input-icon h-12 pl-11"
                            />
                        </div>
                        <button type="submit" className="btn-primary h-12 px-6">
                            Search
                        </button>
                    </form>
                    {categories.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {categories.slice(0, 5).map((c) => (
                                <Link
                                    key={c.name}
                                    to={`/courses?category=${encodeURIComponent(c.name)}`}
                                    className="chip"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    {courses === null && !error ? (
                        <div className="panel p-3" aria-hidden="true">
                            <div className="skeleton aspect-video rounded-xl" />
                            <div className="space-y-3 p-3 pt-5">
                                <div className="skeleton h-4 w-24" />
                                <div className="skeleton h-7 w-5/6" />
                                <div className="skeleton mt-6 h-3.5 w-full" />
                            </div>
                        </div>
                    ) : featured ? (
                        <FeaturedCourse course={featured} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
                            <VideoIcon className="mx-auto size-8 text-primary" />
                            <h2 className="mt-4 text-2xl font-bold">
                                No courses yet
                            </h2>
                            <p className="mt-2 text-muted">
                                Courses appear here as soon as an instructor
                                publishes one.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <section className="container-page pb-16">
                    <ErrorState message={error} onRetry={load} />
                </section>
            )}

            {/* categories as an index */}
            {categories.length > 0 && (
                <section className="container-page py-14">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="text-3xl font-bold sm:text-4xl">
                            Browse by category
                        </h2>
                        <Link
                            to="/courses"
                            className="text-sm font-semibold text-primary hover:text-primary-hover"
                        >
                            View all courses
                        </Link>
                    </div>
                    <ul className="mt-8 grid border-t border-line md:grid-cols-2 md:gap-x-14">
                        {categories.slice(0, 8).map((c) => (
                            <li key={c.name}>
                                <Link
                                    to={`/courses?category=${encodeURIComponent(c.name)}`}
                                    className="group flex items-baseline justify-between gap-4 border-b border-line py-5"
                                >
                                    <span className="font-display text-2xl font-semibold transition-colors group-hover:text-primary">
                                        {c.name}
                                    </span>
                                    <span className="text-sm text-muted">
                                        {plural(c.count, "course")}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* latest */}
            {(courses === null && !error) || latest.length > 0 ? (
                <section className="container-page py-14">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="text-3xl font-bold sm:text-4xl">
                            Latest courses
                        </h2>
                        <Link
                            to="/courses"
                            className="text-sm font-semibold text-primary hover:text-primary-hover"
                        >
                            See everything
                        </Link>
                    </div>
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses === null
                            ? Array.from({ length: 3 }, (_, i) => (
                                  <CourseCardSkeleton key={i} />
                              ))
                            : latest.map((c) => (
                                  <CourseCard key={c._id} course={c} />
                              ))}
                    </div>
                </section>
            ) : (
                courses !== null && (
                    <section className="container-page py-14">
                        <EmptyState
                            icon={<VideoIcon className="size-6" />}
                            title="Nothing to watch yet"
                            description="No courses have been published. If you're an instructor, create the first one."
                            action={
                                isInstructor ? (
                                    <Link
                                        to="/intructor/editor"
                                        className="btn-primary"
                                    >
                                        Create a course
                                    </Link>
                                ) : undefined
                            }
                        />
                    </section>
                )
            )}

            {/* how it works: a real sequence */}
            <section className="container-page py-14">
                <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">
                    From first lecture to finished course
                </h2>
                <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0">
                    {steps.map((s, i) => (
                        <li
                            key={s.title}
                            className="md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0"
                        >
                            <span
                                className="font-display text-7xl font-extrabold leading-none text-primary [font-stretch:76%]"
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <h3 className="mt-4 text-xl font-semibold">
                                {s.title}
                            </h3>
                            <p className="mt-2 max-w-xs text-muted">{s.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* teach: the one solid orange surface on the page */}
            {!authLoading && (!user || isInstructor) && (
                <section className="container-page py-14">
                    <div className="rounded-3xl bg-primary p-8 text-on-primary sm:p-14">
                        <div className="max-w-2xl">
                            <h2 className="font-display text-4xl font-extrabold leading-[0.95] sm:text-6xl font-stretch-80%">
                                Teach what you know.
                            </h2>
                            <p className="mt-5 max-w-xl text-lg/relaxed text-on-primary/80">
                                Upload your videos, arrange them into lectures
                                and set a price. Students can preview free
                                lectures before they enroll.
                            </p>
                            {isInstructor ? (
                                <Link
                                    to="/intructor"
                                    className="mt-8 inline-flex h-12 items-center rounded-xl bg-page px-6 font-semibold text-ink transition-colors hover:bg-surface"
                                >
                                    Open instructor panel
                                </Link>
                            ) : (
                                <>
                                    <button
                                        onClick={() =>
                                            openAuthModal("register")
                                        }
                                        className="mt-8 inline-flex h-12 items-center rounded-xl bg-page px-6 font-semibold text-ink transition-colors hover:bg-surface"
                                    >
                                        Create an instructor account
                                    </button>
                                    <p className="mt-3 text-sm text-on-primary/70">
                                        Choose "Instructor" when you sign up.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

export default Home;
