import { Link, useNavigate, useParams } from "react-router-dom";
import type { Course, Level } from "../types";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { api } from "../config/api";
import AuthGate from "../components/AuthGate";
import {
    EmptyState,
    ErrorState,
    FullPageSpinner,
    Spinner,
} from "../components/ui";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    CheckIcon,
    PlusIcon,
    Trash2Icon,
    UploadIcon,
    VideoIcon,
} from "lucide-react";
import { CATEGORIES, LEVELS } from "../config/constants";
import toast from "react-hot-toast";
import Thumb from "../components/Thumb";
import { durationFromSeconds } from "../config/format";

interface LectureDraft {
    key: string; // local-only id for React lists
    _id?: string; // set for lectures that already exist on the server
    title: string;
    videoUrl: string;
    duration: string;
    freePreview: boolean;
}

interface FormState {
    title: string;
    description: string;
    category: string;
    level: Level;
    price: string;
    thumbnail: string;
}

type Status = "loading" | "ready" | "forbidden" | "missing" | "error";

let keyCounter = 0;
const newKey = () => `lecture-${++keyCounter}`;
const blankLecture = (): LectureDraft => ({
    key: newKey(),
    title: "",
    videoUrl: "",
    duration: "",
    freePreview: false,
});

// Reads a video file length in the browser, before it get uploads;
const readVideoDuration = (file: File) =>
    new Promise<number | null>((resolve) => {
        const url = URL.createObjectURL(file);
        const el = document.createElement("video");
        el.preload = "metadata";
        el.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(Number.isFinite(el.duration) ? el.duration : null);
        };
        el.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        el.src = url;
    });

const ProgressBar = ({ value }: { value: number }) => (
    <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Upload progress"
    >
        <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${value}%` }}
        />
    </div>
);

function Editor({ id }: { id?: string }) {
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { user, isInstructor } = useAuth();

    const [status, setStatus] = useState<Status>(isEdit ? "loading" : "ready");
    const [loadError, setLoadError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [form, setForm] = useState<FormState>({
        title: "",
        description: "",
        category: "Development",
        level: "Beginner",
        price: "0",
        thumbnail: "",
    });
    const [lectures, setLectures] = useState<LectureDraft[]>([blankLecture()]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploads, setUploads] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    ///load the course when editing
    useEffect(() => {
        if (!id || !user) return;
        let ignore = false;
        api.get(`/api/courses/${id}`)
            .then(({ data }) => {
                if (ignore) return;
                const c: Course = data.course;
                if (!data.isInstructor && user.role !== "admin") {
                    setStatus("forbidden");
                    return;
                }
                setForm({
                    title: c.title,
                    description: c.description,
                    category: c.category,
                    level: c.level,
                    price: String(c.price ?? 0),
                    thumbnail: c.thumbnail,
                });

                setLectures(
                    c.lectures.map((l) => ({
                        key: newKey(),
                        _id: l._id,
                        title: l.title,
                        videoUrl: l.videoUrl,
                        duration: l.duration,
                        freePreview: l.freePreview,
                    })),
                );
                setStatus("ready");
            })
            .catch((err) => {
                if (ignore) return;
                if (err.statusCode === 404) setStatus("missing");
                else {
                    setLoadError(err.message);
                    setStatus("error");
                }
            });

        return () => {
            ignore = true;
        };
    }, [id, user, attempt]);

    // warn before closing the tab with unusaved edits
    useEffect(() => {
        if (!dirty) {
            const warn = (e: BeforeUnloadEvent) => {
                e.preventDefault();
            };
            window.addEventListener("beforeunload", warn);
            return () => window.removeEventListener("beforeunload", warn);
        }
    }, [dirty]);

    const uploading = Object.keys(uploads).length > 0;

    const setField = <K extends keyof FormState>(
        key: K,
        value: FormState[K],
    ) => {
        setForm((f) => ({ ...f, [key]: value }));
        setDirty(true);
        setErrors((e) => {
            if (!e[key]) return e;
            const next = { ...e };
            delete next[key];
            return next;
        });
    };

    const updateLecture = (
        key: string,
        patch: Partial<Omit<LectureDraft, "key">>,
        field?: string,
    ) => {
        setLectures((list) =>
            list.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
        setDirty(true);
        if (field)
            setErrors((e) => {
                const errKey = `${key}-${field}`;
                if (!e[errKey]) return e;
                const next = { ...e };
                delete next[errKey];
                return next;
            });
    };

    const moveLecture = (index: number, delta: number) => {
        setLectures((list) => {
            const target = index + delta;
            if (target < 0 || target >= list.length) return list;
            const next = [...list];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
        setDirty(true);
    };

    const upload = async (file: File, key: string): Promise<string | null> => {
        const body = new FormData();
        body.append("file", file);
        setUploads((u) => ({ ...u, [key]: 0 }));
        try {
            const { data } = await api.post("/api/upload", body, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (e) =>
                    setUploads((u) => ({
                        ...u,
                        [key]: e.total
                            ? Math.round((e.loaded / e.total) * 100)
                            : 0,
                    })),
            });
            return data.url as string;
        } catch {
            toast.error("Upload failed");
            return null;
        } finally {
            setUploads((u) => {
                const next = { ...u };
                delete next[key];
                return next;
            });
        }
    };

    const onThumbnailFile = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Choose an img file (JPG, PNG or WebP).");
            return;
        }
        const url = await upload(file, "thumbnail");
        if (url) setField("thumbnail", url);
    };

    const onVideoFile = async (key: string, file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("video/")) {
            toast.error("Choose a video file (MP4, MOV or WebM");
            return;
        }

        const [seconds, url] = await Promise.all([
            readVideoDuration(file),
            upload(file, key),
        ]);
        if (url) {
            updateLecture(
                key,
                {
                    videoUrl: url,
                    ...(seconds
                        ? { duration: durationFromSeconds(seconds) }
                        : {}),
                },
                "video",
            );
        }
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!form.title.trim()) next.title = "Add a course title.";
        if (!form.description.trim()) next.description = "Add a description.";
        if (!form.thumbnail.trim()) next.thumbnail = "Add a thumbnail image.";
        if (
            form.price !== "" &&
            (Number.isNaN(Number(form.price)) || Number(form.price) < 0)
        )
            next.price = "Enter 0 or a positive number.";
        lectures.forEach((l) => {
            if (!l.title.trim())
                next[`${l.key}-title`] = "Add a lecture title.";
            if (!l.videoUrl.trim())
                next[`${l.key}-video`] = "Upload a video or paste its URL.";
        });
        setErrors(next);
        if (Object.keys(next).length > 0) {
            toast.error("Fix the highlighted fields to save.");
            setTimeout(
                () =>
                    document
                        .querySelector<HTMLElement>('[aria-invalid="true"]')
                        ?.focus(),
                0,
            );
            return false;
        }
        return true;
    };

    const save = async () => {
        if (saving || uploading || !validate()) return;
        setSaving(true);
        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category.trim() || "Development",
            level: form.level,
            price: Number(form.price) || 0,
            thumbnail: form.thumbnail.trim(),
            //exisiting lectures keep theri _id so student's progress stays linked
            lectures: lectures.map((l) => ({
                ...(l._id ? { _id: l._id } : {}),
                title: l.title.trim(),
                videoUrl: l.videoUrl.trim(),
                duration: l.duration.trim() || "5 mins",
                freePreview: l.freePreview,
            })),
        };
        try {
            if (isEdit) await api.put(`/api/courses/${id}`, payload);
            else await api.post("/api/courses", payload);

            setDirty(false);
            toast.success(isEdit ? "Changes saved" : "Course created");
            navigate("/instructor");
        } catch (error: any) {
            toast.error(error.message || "Failed to save course");
        } finally {
            setSaving(false);
        }
    };

    const saveButton = (
        <button
            onClick={save}
            disabled={saving || uploading}
            className="btn-primary btn-lg"
        >
            {saving && <Spinner className="size-5" />}
            {uploading
                ? "Uploading..."
                : isEdit
                  ? "Save changes"
                  : "Create course"}
        </button>
    );

    const cancel = () => {
        if (dirty && !window.confirm("Discard your unsaved changes?")) return;
        navigate("/instructor");
    };

    if (!user) {
        return (
            <AuthGate
                title="Sign in to create courses"
                description="You need an instructor account to use the course editor."
            />
        );
    }

    if (!isInstructor) {
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon={<VideoIcon className="size-6" />}
                    title="This area is for instructors"
                    description="Your account is a student account, so it can't create or edit courses."
                    action={
                        <Link to="/courses" className="btn-primary">
                            Browse courses
                        </Link>
                    }
                />
            </div>
        );
    }

    if (status === "loading") return <FullPageSpinner />;
    if (status === "forbidden" || status === "missing")
        return (
            <div className="container-page py-20">
                <EmptyState
                    icon={<VideoIcon className="size-6" />}
                    title={
                        status === "missing"
                            ? "Course not found"
                            : "You can't edit this course"
                    }
                    description={
                        status === "missing"
                            ? "It may have been deleted."
                            : "Only the instructor who created a course can edit it."
                    }
                    action={
                        <Link to="/intructor" className="btn-primary">
                            Back to your courses
                        </Link>
                    }
                />
            </div>
        );

    if (status === "error")
        return (
            <div className="container-page py-20">
                <ErrorState
                    message={loadError}
                    onRetry={() => {
                        setStatus("loading");
                        setAttempt((n) => n + 1);
                    }}
                />
            </div>
        );

    const categoryOptions = Array.from(
        new Set([...CATEGORIES, form.category].filter(Boolean)),
    );

    return (
        <div className="container-page py-10 lg:py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link
                        to={"/instructor"}
                        className="text-sm text-muted hover:text-primary"
                    >
                        Your courses
                    </Link>
                    <h1 className="mt-1 font-display text-4xl font-extrabold font-stretch-80% sm:text-5xl">
                        {isEdit ? "Edit course" : "New course"}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={cancel} className="btn-ghost btn-lg">
                        Cancel
                    </button>
                    {saveButton}
                </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                <div className="space-y-8">
                    <section className="panel space-y-5 p-6">
                        <h2 className="text-xl font-semibold">
                            Course details
                        </h2>
                        <div>
                            <label htmlFor="title" className="label">
                                Title
                            </label>
                            <input
                                id="title"
                                value={form.title}
                                onChange={(e) =>
                                    setField("title", e.target.value)
                                }
                                placeholder="e.g. Modern JavaScript from scratch"
                                className="field"
                            />
                            {errors.title && (
                                <p className="error-text">{errors.title}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="description" className="label">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={form.description}
                                onChange={(e) =>
                                    setField("description", e.target.value)
                                }
                                placeholder="What will students learn, and who is the course for?"
                                rows={6}
                                className="field"
                            />
                            {errors.description && (
                                <p className="error-text">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-baseline justify-between">
                            <h2 className="text-xl font-semibold">Lectures</h2>
                            <p className="text-sm text-muted">
                                {lectures.length}{" "}
                                {lectures.length === 1 ? "lecture" : "lectures"}
                            </p>
                        </div>

                        <ol className="mt-4 space-y-4">
                            {lectures.map((l, i) => {
                                const progress = uploads[l.key];
                                const titleErr = errors[`${l.key}-title`];
                                const videoErr = errors[`${l.key}-video`];
                                return (
                                    <li
                                        key={l.key}
                                        className="panel p-4 sm:p-5"
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            <span className="mt-8 grid size-8 shrink-0 place-items-center rounded-md bg-raised font-display text-sm font-bold">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-4">
                                                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                                                    <div>
                                                        <label
                                                            htmlFor={`${l.key}-title`}
                                                            className="label"
                                                        >
                                                            Lecture title
                                                        </label>
                                                        <input
                                                            id={`${l.key}-title`}
                                                            value={l.title}
                                                            onChange={(e) =>
                                                                updateLecture(
                                                                    l.key,
                                                                    {
                                                                        title: e
                                                                            .target
                                                                            .value,
                                                                    },
                                                                    "title",
                                                                )
                                                            }
                                                            aria-invalid={
                                                                !!titleErr
                                                            }
                                                            className="field"
                                                        />
                                                        {titleErr && (
                                                            <p className="error-text">
                                                                {titleErr}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label
                                                            htmlFor={`${l.key}-duration`}
                                                            className="label"
                                                        >
                                                            Duration
                                                        </label>
                                                        <input
                                                            id={`${l.key}-duration`}
                                                            value={l.duration}
                                                            onChange={(e) =>
                                                                updateLecture(
                                                                    l.key,
                                                                    {
                                                                        duration:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            placeholder="12 mins"
                                                            className="field"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor={`${l.key}-video`}
                                                        className="label"
                                                    >
                                                        Video
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            id={`${l.key}-video`}
                                                            value={l.videoUrl}
                                                            onChange={(e) =>
                                                                updateLecture(
                                                                    l.key,
                                                                    {
                                                                        videoUrl:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                    "video",
                                                                )
                                                            }
                                                            placeholder="Paste a video URL, or upload a file"
                                                            aria-invalid={
                                                                !!videoErr
                                                            }
                                                            className="field min-w-0 flex-1"
                                                        />
                                                        <input
                                                            id={`${l.key}-file`}
                                                            type="file"
                                                            accept="video/*"
                                                            className="sr-only"
                                                            tabIndex={-1}
                                                            onChange={(e) => {
                                                                onVideoFile(
                                                                    l.key,
                                                                    e.target
                                                                        .files?.[0],
                                                                );
                                                                e.target.value =
                                                                    "";
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                progress !==
                                                                undefined
                                                            }
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `${l.key}-file`,
                                                                    )
                                                                    ?.click()
                                                            }
                                                            className="btn-outline h-11 shrink-0"
                                                        >
                                                            {progress !==
                                                            undefined ? (
                                                                <Spinner className="size-4" />
                                                            ) : (
                                                                <UploadIcon className="size-4" />
                                                            )}
                                                            <span className="hidden sm:inline">
                                                                {progress !==
                                                                undefined
                                                                    ? `${progress}%`
                                                                    : "Upload"}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {progress !== undefined && (
                                                        <ProgressBar
                                                            value={progress}
                                                        />
                                                    )}
                                                    {videoErr && (
                                                        <p className="error-text">
                                                            {videoErr}
                                                        </p>
                                                    )}
                                                    {l.videoUrl &&
                                                        progress ===
                                                            undefined &&
                                                        !videoErr && (
                                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-good">
                                                                <CheckIcon className="size-3.5" />{" "}
                                                                Video attached
                                                            </p>
                                                        )}
                                                </div>

                                                <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={l.freePreview}
                                                        onChange={(e) =>
                                                            updateLecture(
                                                                l.key,
                                                                {
                                                                    freePreview:
                                                                        e.target
                                                                            .checked,
                                                                },
                                                            )
                                                        }
                                                        className="size-4 accent-primary"
                                                    />
                                                    Free preview
                                                    <span className="text-muted">
                                                        (anyone can watch before
                                                        enrolling)
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="flex shrink-0 flex-col gap-1">
                                                <button
                                                    onClick={() =>
                                                        moveLecture(i, -1)
                                                    }
                                                    disabled={i === 0}
                                                    className="btn-ghost size-9 p-0!"
                                                    aria-label={`Move lecture ${i + 1} up`}
                                                >
                                                    <ArrowUpIcon className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        moveLecture(i, 1)
                                                    }
                                                    disabled={
                                                        i ===
                                                        lectures.length - 1
                                                    }
                                                    className="btn-ghost size-9 p-0!"
                                                    aria-label={`Move lecture ${i + 1} down`}
                                                >
                                                    <ArrowDownIcon className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setLectures((list) =>
                                                            list.filter(
                                                                (x) =>
                                                                    x.key !==
                                                                    l.key,
                                                            ),
                                                        );
                                                        setDirty(true);
                                                    }}
                                                    className="btn-ghost size-9 p-0! hover:bg-bad/15! hover:text-bad!"
                                                    aria-label={`Remove lecture ${i + 1}`}
                                                >
                                                    <Trash2Icon className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <button
                            onClick={() => {
                                setLectures((list) => [
                                    ...list,
                                    blankLecture(),
                                ]);
                                setDirty(true);
                            }}
                            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-medium text-muted transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                        >
                            <PlusIcon className="size-5" />
                            Add a lecture
                        </button>
                    </section>

                    <div className="flex justify-end lg:hidden">
                        {saveButton}
                    </div>
                </div>

                <aside className="space-y-6 lg:sticky lg:top-24">
                    <section className="panel p-5">
                        <h2 className="text-lg font-semibold">Thumbnail</h2>
                        <Thumb
                            src={form.thumbnail}
                            alt="Thumbnail preview"
                            className="mt-4 aspect-video w-full rounded-lg"
                        />
                        {uploads.thumbnail !== undefined && (
                            <ProgressBar value={uploads.thumbnail} />
                        )}
                        <input
                            id="thumbnail-file"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            tabIndex={-1}
                            onChange={(e) => {
                                onThumbnailFile(e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                        <button
                            type="button"
                            disabled={uploads.thumbnail !== undefined}
                            onClick={() =>
                                document
                                    .getElementById("thumbnail-file")
                                    ?.click()
                            }
                            className="btn-outline mt-4 w-full"
                        >
                            {uploads.thumbnail !== undefined ? (
                                <Spinner className="size-4" />
                            ) : (
                                <UploadIcon className="size-4" />
                            )}
                            Upload image
                        </button>
                        <label htmlFor="thumbnail-url" className="label mt-4">
                            Or paste an image URL
                        </label>
                        <input
                            id="thumbnail-url"
                            value={form.thumbnail}
                            onChange={(e) =>
                                setField("thumbnail", e.target.value)
                            }
                            placeholder="https://"
                            aria-invalid={!!errors.thumbnail}
                            className="field"
                        />
                        {errors.thumbnail && (
                            <p className="error-text">{errors.thumbnail}</p>
                        )}
                    </section>

                    <section className="panel space-y-5 p-5">
                        <h2 className="text-lg font-semibold">Settings</h2>
                        <div>
                            <label htmlFor="category" className="label">
                                Category
                            </label>
                            <input
                                id="category"
                                list="category-options"
                                value={form.category}
                                onChange={(e) =>
                                    setField("category", e.target.value)
                                }
                                className="field"
                            />
                            <datalist id="category-options">
                                {categoryOptions.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                            <p className="hint">Pick one or type your own.</p>
                        </div>
                        <div>
                            <label htmlFor="level" className="label">
                                Level
                            </label>
                            <select
                                id="level"
                                value={form.level}
                                onChange={(e) =>
                                    setField("level", e.target.value as Level)
                                }
                                className="field"
                            >
                                {LEVELS.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="price" className="label">
                                Price
                            </label>
                            <input
                                id="price"
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={form.price}
                                onChange={(e) =>
                                    setField("price", e.target.value)
                                }
                                aria-invalid={!!errors.price}
                                className="field"
                            />
                            {errors.price ? (
                                <p className="error-text">{errors.price}</p>
                            ) : (
                                <p className="hint">
                                    Enter 0 for a free course.
                                </p>
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

// remount the editor when switching between "new" and "edit " routes;
function CourseEditor() {
    const { id } = useParams();
    return <Editor key={id ?? "new"} id={id} />;
}

export default CourseEditor;
