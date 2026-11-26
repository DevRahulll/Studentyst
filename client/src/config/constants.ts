import type { Level } from "../types";

export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

// The backend stores category as a free-form string, so these are only
// suggestions for filters and the course editor.
export const CATEGORIES = [
    "Development",
    "Design",
    "Business",
    "Marketing",
    "Data Science",
    "Photography",
    "Music",
    "Personal Development",
];
