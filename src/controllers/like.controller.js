import mongoose, { isValidObjectId } from "mongoose"
import { Likes } from "../models/likes.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (videoId !== "" && !isValidObjectId(videoId))
        throw new ApiError("Invalid MongoDB Object ID !!", 400);
    //TODO: toggle like on video

    const videoLike = await Likes.findOne({ video: videoId });
    if (!videoLike) {
        // Create new document
        const newVideoLike = await Likes.create({
            likedBy: req.user._id,
            video: videoId
        })

        if (!newVideoLike)
            throw new ApiError("Something went wrong in creating Like !!", 500);

        return res.status(201).json(new ApiResponse(201, "Like added to Video !!", newVideoLike));
    }
    else {
        // Delete the exisiting document
        const deletedVideoLike = await Likes.deleteOne({ video: videoId });
        if (!deletedVideoLike)
            throw new ApiError("Something went wrong in deleting Like !!", 500);

        return res.status(200).json(new ApiResponse(200, "Like removed from Video !!", {}));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (commentId !== "" && !isValidObjectId(commentId))
        throw new ApiError("Invalid MongoDB Object ID !!", 400);
    //TODO: toggle like on comment
    const commentLike = await Likes.findOne({ comment: commentId });

    if (!commentLike) {
        // Create new document
        const newCommentLike = await Likes.create({
            likedBy: req.user._id,
            comment: comm
        })

        if (!newCommentLike)
            throw new ApiError("Something went wrong in creating Like !!", 500);

        return res.status(201).json(new ApiResponse(201, "Like added to Comment !!", newCommentLike));
    }
    else {
        // Delete the exisiting document
        const deletedCommentLike = await Likes.deleteOne({ comment: commentId });
        if (!deletedCommentLike)
            throw new ApiError("Something went wrong in deleting Like !!", 500);

        return res.status(200).json(new ApiResponse(200, "Like removed from Comment !!", {}));
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (tweetId !== "" && !isValidObjectId(tweetId))
        throw new ApiError("Invalid MongoDB Object ID !!", 400);
    //TODO: toggle like on tweet

    const tweetLike = await Likes.findOne({ tweet: tweetId });
    if (!tweetLike) {
        // Create new document
        const newTweetLike = await Likes.create({
            likedBy: req.user._id,
            tweet: tweetId
        })

        if (!newTweetLike)
            throw new ApiError("Something went wrong in creating Like !!", 500);

        return res.status(201).json(new ApiResponse(201, "Like added to Tweet !!", newTweetLike));
    }
    else {
        // Delete the exisiting document
        const deletedTweetLike = await Likes.deleteOne({ tweet: tweetId });
        if (!deletedTweetLike)
            throw new ApiError("Something went wrong in deleting Like !!", 500);

        return res.status(200).json(new ApiResponse(200, "Like removed from Tweet !!", {}));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}