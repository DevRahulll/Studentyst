import {
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    MailIcon,
    UserIcon,
    XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";
import { LogoMark } from "./logo";

type Role = "student" | "instructor";

const roles: { value: Role; title: string; text: string }[] = [
    {
        value: "student",
        title: "Student",
        text: "Take courses and track progress",
    },
    {
        value: "instructor",
        title: "Instructor",
        text: "Create and publish courses",
    },
];

function AuthModal() {
    const {
        user,
        login,
        register,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
    } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<Role>("student");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const firstField = useRef<HTMLInputElement>(null);

    const close = () => setIsAuthModalOpen(false);
    const open = isAuthModalOpen && !user;

    useEffect(() => {
        if (open) firstField.current?.focus();
    }, [open, authModalMode]);

    if (!open) return null;

    const isRegister = authModalMode === "register";

    const switchMode = (mode: "login" | "register") => {
        setAuthModalMode(mode);
        setErrors({});
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const ok = isRegister
            ? await register(name, email, password, role)
            : await login(email, password);

        setSubmitting(false);
        if (ok) {
            setPassword("");
            setErrors({});
        }
    };

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
            <div role="dialog" className="modal-card">
                <button
                    onClick={close}
                    className="btn-ghost absolute right-3 top-3 size-9 !p-0"
                >
                    <XIcon className="size-5" />
                </button>

                <LogoMark className="size-10" />
                <h2 id="auth-title" className="mt-5 text-2xl font-bold">
                    {isRegister
                        ? "Create your account"
                        : "Sign in to Studentyst"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                    {isRegister
                        ? "Start learning, or publish your first course."
                        : "Pick up where you left off."}
                </p>

                <div
                    role="tablist"
                    className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-page p-1"
                >
                    {(["login", "register"] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            role="tab"
                            aria-selected={authModalMode === mode}
                            onClick={() => switchMode(mode)}
                            className={`rounded-md py-2 text-sm font-semibold transition-colors ${
                                authModalMode === mode
                                    ? "bg-raised text-ink"
                                    : "text-muted hover:text-ink"
                            }`}
                        >
                            {mode === "login" ? "Sign in" : "Create account"}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-5 space-y-4"
                >
                    {isRegister && (
                        <div>
                            <label htmlFor="auth-name" className="label">
                                Full name
                            </label>
                            <div className="relative">
                                <UserIcon className="pointer-events-none absolute left-3 top-3 size-5 text-faint" />
                                <input
                                    id="auth-name"
                                    ref={firstField}
                                    type="text"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ram Sharma"
                                    aria-invalid={!!errors.name}
                                    className="input-icon"
                                />
                            </div>
                            {errors.name && (
                                <p className="error-text">{errors.name}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="auth-email" className="label">
                            Email
                        </label>
                        <div className="relative">
                            <MailIcon className="pointer-events-none absolute left-3 top-3 size-5 text-faint" />
                            <input
                                id="auth-email"
                                ref={isRegister ? undefined : firstField}
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ram@example.com"
                                aria-invalid={!!errors.email}
                                className="input-icon"
                            />
                        </div>
                        {errors.email && (
                            <p className="error-text">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="auth-password" className="label">
                            Password
                        </label>
                        <div className="relative">
                            <LockIcon className="pointer-events-none absolute left-3 top-3 size-5 text-faint" />
                            <input
                                id="auth-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete={
                                    isRegister
                                        ? "new-password"
                                        : "current-password"
                                }
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={
                                    isRegister
                                        ? "At least 6 characters"
                                        : "Your password"
                                }
                                aria-invalid={!!errors.password}
                                className="input-icon pr-11"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-md text-faint hover:text-ink"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOffIcon className="size-4" />
                                ) : (
                                    <EyeIcon className="size-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="error-text">{errors.password}</p>
                        )}
                    </div>

                    {isRegister && (
                        <fieldset>
                            <legend className="label">I want to</legend>
                            <div className="grid grid-cols-2 gap-2.5">
                                {roles.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className={`rounded-lg border p-3 text-left transition-colors ${
                                            role === r.value
                                                ? "border-primary bg-primary/12"
                                                : "border-line hover:border-faint"
                                        }`}
                                    >
                                        <span
                                            className={`block text-sm font-semibold ${
                                                role === r.value
                                                    ? "text-primary"
                                                    : ""
                                            }`}
                                        >
                                            {r.title}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-snug text-muted">
                                            {r.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary btn-lg w-full"
                    >
                        {submitting && <Spinner className="size-5" />}
                        {isRegister ? "Create account" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AuthModal;
