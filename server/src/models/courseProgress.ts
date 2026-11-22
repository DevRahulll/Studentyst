import mongoose, { InferSchemaType, mongo, Schema } from "mongoose";

const progressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    completedLectures: [{ type: String }],
    isCompleted: { type: Boolean, default: false },
});

progressSchema.index({ user: 1, course: 1 }, { unique: true });

export type IProgress = InferSchemaType<typeof progressSchema> & {
    _id: string;
};

export const Progress = mongoose.model("Progress", progressSchema);
