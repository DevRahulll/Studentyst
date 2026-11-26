import { useEffect, useMemo, useState } from "react";
import { api } from "../config/api";
import { useSearchParams } from "react-router-dom";
import { CATEGORIES, LEVELS } from "../config/constants";
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { CourseCardSkeleton, EmptyState, ErrorState } from "../components/ui";
import CourseCard from "../components/CourseCard";
import type { Course } from "../types";

const SORTS = [
    { value: "newest", label: "Newest first" },
    { value: "popular", label: "Most students" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
];

function Courses() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q") ?? "";
    const category = params.get("category") ?? "All";
    const level = params.get("level") ?? "All";
    const sort = params.get("sort") ?? "newest";

    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const requestKey = `${q}|${category}|${level}|${attempt}`;
    const loading = loadedKey !== requestKey;

    const setParam = (key: string, value: string, fallback: string) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (!value || value === fallback) next.delete(key);
                else next.set(key, value);
                return next;
            },
            { replace: true },
        );

    //push the search box into the URL after a short pause in typing

    useEffect(() => {
        const t = setTimeout(() => {
            setParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    const value = search.trim();
                    if (value) next.set("q", value);
                    else next.delete("q");
                    return next;
                },
                { replace: true },
            );
        }, 400);

        return () => clearTimeout(t);
    }, [search, setParams]);

    useEffect(() => {
        let ignore = false;
        api.get("/api/courses", {
            params: {
                search: "",
                category: "",
                level: "",
            },
        })
            .then((res) => {
                if (ignore) return;
                setCourses(res.data.courses);
                setError(null);
            })
            .catch((err) => !ignore && setError(err))
            .finally(() => !ignore && setLoadedKey(""));

        return () => {
            ignore = true;
        };
    }, [q, category, level, attempt]);

    const categories = useMemo(
        () =>
            Array.from(
                new Set([
                    ...CATEGORIES,
                    ...(courses ?? []).map((c) => c.category),
                    ...(category !== "All" ? [category] : []),
                ]),
            ),
        [courses, category],
    );

    const sorted = useMemo(() => {
        const list = [...(courses ?? [])];
        switch (sort) {
            case "popular":
                return list.sort(
                    (a, b) =>
                        b.enrolledStudents.length - a.enrolledStudents.length,
                );

            case "price-asc":
                return list.sort((a, b) => a.price - b.price);

            case "price-desc":
                return list.sort((a, b) => b.price - a.price);

            default:
                return list;
        }
    }, [courses, sort]);

    const activeFilters =
        (category !== "All" ? 1 : 0) + (level !== "All" ? 1 : 0);
    const hasAny = activeFilters > 0 || q !== "";

    const clearAll = () => {
        setSearch("");
        setParams({}, { replace: true });
    };

    const filters = (
        <div className="space-y-7">
            <FilterGroup
                title="Category"
                options={categories}
                value={category}
                onChange={(v) => setParam("category", v, "All")}
            />
            <FilterGroup
                title="Level"
                options={LEVELS}
                value={level}
                onChange={(v) => setParam("level", v, "All")}
            />
        </div>
    );

    return (
        <div className="container-page py-10 lg:py-14">
            <h1 className="font-display text-5xl font-extrabold font-stretch-78% sm:text-6xl">
                Courses
            </h1>
            <p className="mt-2 text-muted">
                {courses === null ? "Loading courses" : "No Courses found"}
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
                <aside className="hidden lg:block">
                    <div className="sticky top-24">{filters}</div>
                </aside>

                <section>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-faint" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title or description"
                                aria-label="Search courses"
                                className="input-icon h-12 pl-11"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-md text-faint hover:text-ink"
                                    aria-label="Clear search"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFiltersOpen((o) => !o)}
                                className="btn-outline h-12 flex-1 lg:hidden"
                                aria-expanded={filtersOpen}
                            >
                                <SlidersHorizontalIcon className="size-4" />
                                Filters
                                {activeFilters > 0 ? ` (${activeFilters})` : ""}
                            </button>
                            <select
                                value={sort}
                                onChange={(e) =>
                                    setParam("sort", e.target.value, "newest")
                                }
                                aria-label="Sort courses"
                                className="field h-12 flex-1 sm:w-52 sm:flex-none"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="panel mt-4 p-4 lg:hidden">
                            {filters}
                        </div>
                    )}

                    {hasAny && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {category !== "All" && (
                                <button
                                    onClick={() =>
                                        setParam("category", "All", "All")
                                    }
                                    className="chip chip-active"
                                >
                                    {category} <XIcon className="size-3.5" />
                                </button>
                            )}
                            {level !== "All" && (
                                <button
                                    onClick={() =>
                                        setParam("level", "All", "All")
                                    }
                                    className="chip chip-active"
                                >
                                    {level} <XIcon className="size-3.5" />
                                </button>
                            )}
                            <button
                                onClick={clearAll}
                                className="px-2 text-sm font-medium text-muted hover:text-primary"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    <div
                        className={`mt-6 transition-opacity ${loading && courses ? "opacity-50" : ""}`}
                    >
                        {error ? (
                            <ErrorState
                                message={error}
                                onRetry={() => setAttempt((n) => n + 1)}
                            />
                        ) : courses === null ? (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <CourseCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : sorted.length === 0 ? (
                            <EmptyState
                                icon={<SearchIcon className="size-6" />}
                                title={
                                    hasAny
                                        ? "No courses match"
                                        : "No courses yet"
                                }
                                description={
                                    hasAny
                                        ? "Try a different search term, or remove a filter."
                                        : "Courses will show up here once instructors publish them."
                                }
                                action={
                                    hasAny ? (
                                        <button
                                            onClick={clearAll}
                                            className="btn-outline"
                                        >
                                            Clear search and filters
                                        </button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {sorted.map((c) => (
                                    <CourseCard key={c._id} course={c} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Courses;

function FilterGroup({
    title,
    options,
    value,
    onChange,
}: {
    title: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div role="radiogroup">
            <h2 className="mb-2 px-3 text-sm font-semibold">{title}</h2>
            <div className="flex flex-col">
                {["All", ...options].map((opt) => {
                    const active = value === opt;
                    return (
                        <button
                            key={opt}
                            role="radio"
                            aria-checked={active}
                            onClick={() => onChange(opt)}
                            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                active
                                    ? "bg-primary/15 font-semibold text-primary"
                                    : "text-muted hover:bg-raised hover:text-ink"
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
