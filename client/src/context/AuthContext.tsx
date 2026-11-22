import { createContext } from "react";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
}
