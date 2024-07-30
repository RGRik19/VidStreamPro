import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
    },
    description: {
      type: String,
      required: [true, "Playlist description is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model("Playlist", playlistSchema);
