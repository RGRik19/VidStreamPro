import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!channelId || !isValidObjectId(channelId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);
    const alreadySubscribed = await Subscription.findOne({
        channel: mongoose.Types.ObjectId(channelId),
        subscriber: mongoose.Types.ObjectId(req.user?._id)
    })

    if (!alreadySubscribed) {
        // Remove this subscription
        const deletedSubscription = await Subscription.deleteOne({
            channel: mongoose.Types.ObjectId(channelId),
            subscriber: mongoose.Types.ObjectId(req.user?._id)
        })

        if (!deletedSubscription)
            throw new ApiError("Something went wrong in deleting from DB !!", 500);

        return res.status(200).json(new ApiResponse(200, "Deleted subscription successfully !!", {}));
    }
    else {
        // Add the subscription
        const newSubscription = await Subscription.create({
            channel: mongoose.Types.ObjectId(channelId),
            subscriber: mongoose.Types.ObjectId(req.user?._id)
        })

        if (!newSubscription)
            throw new ApiError("Something went wrong in deleting from DB !!", 500);

        return res.status(201).json(new ApiResponse(201, "Subscription created successfully !!", newSubscription));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!channelId || !isValidObjectId(channelId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);
    const allSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscriber",
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
            $unwind: "$subscriber"
        }
    ]);

    if (!allSubscribers)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "All Subscribers fetched successfully !!", allSubscribers));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const allSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
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
            $unwind: "$channel"
        }
    ]);

    if (!allSubscribedChannels)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "All Subscribed Channels fetched successfully !!", allSubscribedChannels));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}