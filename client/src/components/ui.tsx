import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";

export const Spinner = ({ className = "size-5" }: { className?: string }) => (
    <Loader2Icon className={`animate-spin ${className}`} />
);

export const ErrorState = ({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) => (
    <div className="flex flex-col items-center rounded-2xl border border-bad/30 bg-bad/5 px-6 py-14 text-center">
        <AlertTriangleIcon className="size-8 text-bad" />
        <h3 className="mt-4 text-lg font-semibold">Couldn't load this</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="btn-outline mt-5">
                Try again
            </button>
        )}
    </div>
);

export const CourseCardSkeleton = () => (
    <div className="panel overflow-hidden" aria-hidden="true">
        <div className="skeleton aspect-video rounded-none" />
        <div className="space-y-3 p-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-5 w-5/6" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton mt-5 h-2 w-full" />
        </div>
    </div>
);

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export const EmptyState = ({
    icon,
    title,
    description,
    action,
}: EmptyStateProps) => (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary">
            {icon}
        </div>
        <h3 className="mt-5 text-xl font-semibold">{title}</h3>
        {description && (
            <p className="mt-2 max-w-md text-muted">{description}</p>
        )}
        {action && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                {action}
            </div>
        )}
    </div>
);

export const FullPageSpinner = () => (
    <div className="grid min-h-[60vh] place-items-center text-primary">
        <Spinner className="size-8" />
    </div>
);
