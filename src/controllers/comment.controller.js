import mongoose, { isValidObjectId } from "mongoose"
import { Comments } from "../models/comments.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId))
        throw new ApiError("Invalid VideoID !!", 400);

    const allComments = await Comments.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ]);

    if (!allComments)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    const paginatedComments = await Comments.aggregatePaginate(allComments,
        {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        }
    )

    if (!paginatedComments)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Comments fetched successfully !!", paginatedComments));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId)
        throw new ApiError("Invalid MongoDB ObjectID for Video !!", 400);

    if (!content)
        throw new ApiError("Content is Required !!", 400);

    const addedComment = await Comments.create({
        owner: req.user?._id,
        content,
        video: videoId
    })

    if (!addedComment)
        throw new ApiError("Something went wrong in adding Comment !!", 500);

    return res.status(201).json(new ApiResponse(201, "Comment created successfully !!", addedComment));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    const updatedComment = await Comments.findByIdAndUpdate(commentId, {
        content
    }, {
        new: true
    });

    if (!updatedComment)
        throw new ApiError("Something went wrong in updating Comment !!", 500);

    return res.status(200).json(new ApiResponse(200, "Updated Comment successfully !!", updatedComment));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId))
        throw new ApiError("Invalid MongoDB ObjectID for Comment !!", 400);

    const deletedComment = await Comments.findByIdAndDelete(commentId);

    if (!deletedComment)
        throw new ApiError("Something went wrong in deleting Comment !!", 500);

    return res.status(200).json(new ApiResponse(200, "Updated Comment successfully !!", deletedComment));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}