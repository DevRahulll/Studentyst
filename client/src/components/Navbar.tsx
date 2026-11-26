import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    BookOpenIcon,
    ChevronDownIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    MenuIcon,
    XIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials } from "../config/format.ts";
import Logo from "./logo.tsx";

function Navbar() {
    const { user, isInstructor, loading, logout, openAuthModal } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // close the account menu on outside click or Escape
    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node))
                setMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const links = [
        { to: "/courses", label: "Courses" },
        ...(user ? [{ to: "/my-learning", label: "My learning" }] : []),
        ...(isInstructor ? [{ to: "/intructor", label: "Instructor" }] : []),
    ];

    const closeAll = () => {
        setMenuOpen(false);
        setMobileOpen(false);
    };

    const handleLogout = async () => {
        closeAll();
        await logout();
        navigate("/");
    };

    return (
        <header className="sticky top-0 z-40 border-b border-line-soft bg-page/85 backdrop-blur-md">
            <div className="container-page flex h-16 items-center justify-between gap-6">
                <div className="flex items-center gap-10">
                    <Logo onClick={closeAll} />
                    <nav className="hidden items-center gap-1 md:flex">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "text-ink after:absolute after:inset-x-3 after:-bottom-4.25 after:h-0.5 after:rounded-full after:bg-primary"
                                            : "text-muted hover:text-ink"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="skeleton size-9 rounded-full" />
                    ) : user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition-colors hover:border-primary/60 sm:pr-3"
                            >
                                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary">
                                    {initials(user.name)}
                                </span>
                                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                                    {user.name}
                                </span>
                                <ChevronDownIcon className="size-4 text-muted" />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/50"
                                >
                                    <div className="px-3 py-2.5">
                                        <p className="truncate font-semibold">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-xs text-muted">
                                            {user.email}
                                        </p>
                                        <span className="mt-2 inline-flex rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="my-1 h-px bg-line" />
                                    <Link
                                        to="/my-learning"
                                        role="menuitem"
                                        onClick={closeAll}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-raised hover:text-ink"
                                    >
                                        <BookOpenIcon className="size-4" /> My
                                        learning
                                    </Link>
                                    {isInstructor && (
                                        <Link
                                            to="/intructor"
                                            role="menuitem"
                                            onClick={closeAll}
                                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-raised hover:text-ink"
                                        >
                                            <LayoutDashboardIcon className="size-4" />{" "}
                                            Instructor panel
                                        </Link>
                                    )}
                                    <button
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-raised hover:text-ink"
                                    >
                                        <LogOutIcon className="size-4" /> Sign
                                        out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 sm:flex">
                            <button
                                onClick={() => openAuthModal("login")}
                                className="btn-ghost"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={() => openAuthModal("register")}
                                className="btn-primary"
                            >
                                Get started
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileOpen((o) => !o)}
                        className="btn-ghost size-10 p-0!
                        
                        
                        md:hidden"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? (
                            <XIcon className="size-5" />
                        ) : (
                            <MenuIcon className="size-5" />
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <nav
                    className="border-t border-line-soft bg-page md:hidden"
                    aria-label="Mobile"
                >
                    <div className="container-page flex flex-col gap-1 py-3">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={closeAll}
                                className={({ isActive }) =>
                                    `rounded-lg px-3 py-3 text-base font-medium ${
                                        isActive
                                            ? "bg-primary/12 text-primary"
                                            : "text-muted"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        {!loading && !user && (
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line-soft pt-4">
                                <button
                                    onClick={() => {
                                        closeAll();
                                        openAuthModal("login");
                                    }}
                                    className="btn-outline"
                                >
                                    Sign in
                                </button>
                                <button
                                    onClick={() => {
                                        closeAll();
                                        openAuthModal("register");
                                    }}
                                    className="btn-primary"
                                >
                                    Get started
                                </button>
                            </div>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}

export default Navbar;
