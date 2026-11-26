import { LockIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "./ui";

function AuthGate({
    title = "Sign in to continue",
    description = "You nedd an  accounnt to see this page.",
}: {
    title?: string;
    description?: string;
}) {
    const { openAuthModal } = useAuth();
    return (
        <div className="container-page py-20">
            <EmptyState
                icon={<LockIcon className="size-6" />}
                title={title}
                description={description}
                action={
                    <>
                        <button
                            onClick={() => openAuthModal("login")}
                            className="btn-primary"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => openAuthModal("register")}
                            className="btn-outline"
                        >
                            Create account
                        </button>
                    </>
                }
            />
        </div>
    );
}

export default AuthGate;
