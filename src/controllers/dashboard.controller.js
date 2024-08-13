import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Likes } from "../models/likes.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { userId: channelId } = req.user?._id;

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ]);
    if (!videoStats)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: 'totalSubscribers'
        }
    ]);

    if (!totalSubscribers)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    const totalSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: 'totalSubscribedChannels'
        }
    ]);

    if (!totalSubscribedChannels)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    const totalLikes = await Likes.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                    $ne: null
                },
            },
        },
        {
            $lookup: {
                from: "sample_videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $match: {
                            owner: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$video",
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $count: "totalLikes",
        },
    ])

    if (!totalLikes)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    const data = await { ...totalLikes, ...totalSubscribedChannels, ...totalSubscribers, ...totalVideos };
    if (!data)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Channel Stats fetched successfully !!", data));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const allUserVideos = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(req.user?._id)
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
    ])

    if (!allUserVideos)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "All User Videos fetched successfully !!", allUserVideos));
})

export {
    getChannelStats,
    getChannelVideos
}