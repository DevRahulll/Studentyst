import mongoose, { InferSchemaType, mongo, Schema } from "mongoose";

const lectureSchema = new Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String, default: "5 mins" },
    freePreview: { type: Boolean, default: false },
});

export type ILecture = InferSchemaType<typeof lectureSchema> & { _id: string };

const courseSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: { type: String, required: true, default: "Development" },
        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner",
        },
        price: { type: Number, default: 0 },
        thumbnail: { type: String, required: true },
        instructor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        instructorName: { type: String, required: true },
        lectures: [lectureSchema],
        enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true },
);

export type ICourse = InferSchemaType<typeof courseSchema> & { _id: string };

export const Course = mongoose.model("Course", courseSchema);
