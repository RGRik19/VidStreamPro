import mongoose from "mongoose";

const likesSchema = new mongoose.Schema(
  {
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true }
);

export const Likes = mongoose.model("Likes", likesSchema);
