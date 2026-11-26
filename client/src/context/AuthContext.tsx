import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../config/api";
import toast from "react-hot-toast";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isInstructor: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (
        name: string,
        email: string,
        password: string,
        role?: string,
    ) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthModalOpen: boolean;
    setIsAuthModalOpen: (open: boolean) => void;
    authModalMode: "login" | "register";
    setAuthModalMode: (mode: "login" | "register") => void;
    openAuthModal: (mode?: "login" | "register") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
    const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
        "login",
    );

    const openAuthModal = (mode: "login" | "register" = "login") => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(true);
    };

    // check if user is logged in via cookie on startup
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get("/api/auth/me");
                if (res.data.success && res.data?.user) {
                    setUser(res.data.user);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const res = await api.post("/api/auth/login", {
                email,
                password,
            });

            if (res.data.success) {
                setUser(res.data.user);
                toast.success(`Welcome back ${res.data.user.name}!`);
                setIsAuthModalOpen(false);
                return true;
            }
            return false;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Login failed");
            return false;
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
    ): Promise<boolean> => {
        try {
            const res = await api.post("/api/auth/register", {
                name,
                email,
                password,
            });
            console.log("api", api.getUri);

            if (res.data.success) {
                setUser(res.data.user);
                toast.success(`Account created successfully!`);
                setIsAuthModalOpen(false);
                return true;
            }
            return false;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Registration failed");
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            toast.success("Logged out succesfully");
        } catch {
            setUser(null);
        }
    };

    const isInstructor = user?.role === "instructor" || user?.role === "admin";

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isInstructor,
                register,
                login,
                logout,
                isAuthModalOpen,
                setIsAuthModalOpen,
                authModalMode,
                setAuthModalMode,
                openAuthModal,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
