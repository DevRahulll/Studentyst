import mongoose, { InferSchemaType, Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["student", "instructor", "admin"],
            default: "student",
        },
    },
    { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & { _id: string };

export const User = mongoose.model("User", userSchema);
