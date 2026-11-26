interface LectureBarProps {
    /** number of lectures in the course */
    total: number;
    /** lectures to light up (completed, or free to preview) */
    lit?: number;
    /** cap on drawn segments; longer courses are scaled down */
    max?: number;
    size?: "sm" | "md" | "lg";
    /** light the segments one after another once on load */
    animate?: boolean;
    label?: string;
    className?: string;
}

const heights = { sm: "h-1.5", md: "h-2", lg: "h-3.5" };

/**
 * The signature element: one segment per lecture. Lit segments are lectures
 * the student has finished (or, on catalog cards, lectures free to preview).
 */
function LectureBar({
    total,
    lit = 0,
    max = 14,
    size = "md",
    animate = false,
    label,
    className = "",
}: LectureBarProps) {
    if (total <= 0) {
        return (
            <div
                aria-hidden="true"
                className={`rounded-full bg-line-soft ${heights[size]} ${className}`}
            />
        );
    }

    const count = Math.min(total, max);
    let on = Math.round((Math.min(lit, total) / total) * count);
    if (lit > 0 && on === 0) on = 1;
    if (lit < total && on === count) on = count - 1;

    return (
        <div
            role="img"
            aria-label={label ?? `${lit} of ${total} lectures`}
            className={`flex gap-0.75 ${className}`}
        >
            {Array.from({ length: count }, (_, i) => (
                <span
                    key={i}
                    className={`min-w-0 flex-1 rounded-full ${heights[size]} ${
                        i < on ? "bg-primary" : "bg-line"
                    } ${animate && i < on ? "seg-animate" : ""}`}
                    style={
                        animate && i < on
                            ? { animationDelay: `${400 + i * 90}ms` }
                            : undefined
                    }
                />
            ))}
        </div>
    );
}

export default LectureBar;
