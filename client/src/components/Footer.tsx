import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./logo";

const linkClass = "text-sm text-muted transition-colors hover:text-primary";

function Footer() {
    const { user, isInstructor, openAuthModal, logout } = useAuth();

    return (
        <footer className="mt-24 border-t border-line-soft bg-surface">
            <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div>
                    <Logo />
                    <p className="mt-4 max-w-xs text-sm text-muted">
                        Video courses with lecture-by-lecture progress. Learn at
                        your own pace, or publish a course of your own.
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold">Learn</h4>
                    <ul className="mt-4 space-y-2.5">
                        <li>
                            <Link to="/courses" className={linkClass}>
                                All courses
                            </Link>
                        </li>
                        <li>
                            <Link to="/my-learning" className={linkClass}>
                                My learning
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold">Teach</h4>
                    <ul className="mt-4 space-y-2.5">
                        {isInstructor ? (
                            <>
                                <li>
                                    <Link to="/intructor" className={linkClass}>
                                        Instructor panel
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/intructor/editor"
                                        className={linkClass}
                                    >
                                        Create a course
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <li>
                                <button
                                    onClick={() => openAuthModal("register")}
                                    className={linkClass}
                                >
                                    Become an instructor
                                </button>
                            </li>
                        )}
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold">Account</h4>
                    <ul className="mt-4 space-y-2.5">
                        {user ? (
                            <>
                                <li className="truncate text-sm text-muted">
                                    {user.email}
                                </li>
                                <li>
                                    <button
                                        onClick={logout}
                                        className={linkClass}
                                    >
                                        Sign out
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <button
                                        onClick={() => openAuthModal("login")}
                                        className={linkClass}
                                    >
                                        Sign in
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() =>
                                            openAuthModal("register")
                                        }
                                        className={linkClass}
                                    >
                                        Create account
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
            <div className="border-t border-line-soft">
                <div className="container-page py-5 text-xs text-faint">
                    © {new Date().getFullYear()} Studentyst
                </div>
            </div>
        </footer>
    );
}

export default Footer;
