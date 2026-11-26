import type { Lecture } from "../types";

// Prices are plain numbers in the database. Change the symbol here if needed.
export const CURRENCY = "₹";

export const formatPrice = (price: number): string =>
    price > 0 ? `${CURRENCY}${price.toLocaleString("en-IN")}` : "Free";

export const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const plural = (n: number, word: string): string =>
    `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

export const initials = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";

/** Best-effort parse of strings like "12 mins", "1 hr 5 min", "45 secs". */
export const parseMinutes = (text: string): number | null => {
    const re =
        /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
    let total = 0;
    let found = false;
    for (const match of text.matchAll(re)) {
        found = true;
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith("h")) total += value * 60;
        else if (unit.startsWith("m")) total += value;
        else total += value / 60;
    }
    return found ? total : null;
};

export const formatTotalDuration = (lectures: Lecture[]): string | null => {
    let total = 0;
    let any = false;
    for (const lecture of lectures) {
        const minutes = parseMinutes(lecture.duration || "");
        if (minutes !== null) {
            total += minutes;
            any = true;
        }
    }
    if (!any) return null;
    const rounded = Math.max(1, Math.round(total));
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

/** Turns a video length in seconds into the text stored on a lecture. */
export const durationFromSeconds = (seconds: number): string => {
    if (seconds < 60) return `${Math.max(1, Math.round(seconds))} secs`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} mins`;
};
