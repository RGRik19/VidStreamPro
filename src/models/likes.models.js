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
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet"
    }
  },
  { timestamps: true }
);

export const Likes = mongoose.model("Likes", likesSchema);
