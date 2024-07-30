import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Tweets = mongoose.model("Tweet", tweetsSchema);
