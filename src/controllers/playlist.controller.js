import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlists.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name || !description)
        throw new ApiError("Required fields are missing !!", 400);
    //TODO: create playlist

    const newPlaylist = await Playlist.create({
        name,
        description
    })

    if (!newPlaylist)
        throw new ApiError("Something went wrong in creating in DB !!", 500);

    return res.status(201).json(new ApiResponse(201, "Playlist created successfully !!", newPlaylist));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos", // To lookup for objects inside arrays
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            "owner.userName": 1,
                            "owner.fullName": 1,
                            "owner.avatar": 1
                        }
                    }
                ]
            }
        },
    ])

    if (!userPlaylists)
        throw new ApiError("Something went wrong in fetching from DB !!", 500);

    return res
        .status(200)
        .json(new ApiResponse(200, "User Playlists Fetched Successfully !!", userPlaylists));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos", // To lookup for objects inside arrays
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            "owner.userName": 1,
                            "owner.fullName": 1,
                            "owner.avatar": 1
                        }
                    }
                ]
            }
        },
    ])

    if (!playlist)
        throw new ApiError("Something went wrong in fetching playlist from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Playlist fetched successfully !!", playlist));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist)
        throw new ApiError("Something went wrong in updating to DB !!", 500);

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos", // To lookup for objects inside arrays
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            "owner.userName": 1,
                            "owner.fullName": 1,
                            "owner.avatar": 1
                        }
                    }
                ]
            }
        },
    ])

    if (!playlist)
        throw new ApiError("Something went wrong in fetching playlist from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Playlist fetched successfully !!", playlist));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
        throw new ApiError("Invalid MongoDB ObjectID !!", 400);

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist)
        throw new ApiError("Something went wrong in updating to DB !!", 500);

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos", // To lookup for objects inside arrays
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            "owner.userName": 1,
                            "owner.fullName": 1,
                            "owner.avatar": 1
                        }
                    }
                ]
            }
        },
    ])

    if (!playlist)
        throw new ApiError("Something went wrong in fetching playlist from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Playlist fetched successfully !!", playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId))
        throw new ApiError("Invalid MongoDB Object ID !!", 400);

    const deletedPlaylist = await Playlist.deleteOne({ _id: playlistId });

    if (!deletedPlaylist)
        throw new ApiError("Something went wrong in deleting Playlist !!", 500);

    return res.status(204).json(new ApiResponse(204, "Playlist deleted successfully !!"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist)
        throw new ApiError("Something went wrong in updating the Playlist !!", 500);

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos", // To lookup for objects inside arrays
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $project: {
                            "owner.userName": 1,
                            "owner.fullName": 1,
                            "owner.avatar": 1
                        }
                    }
                ]
            }
        },
    ])

    if (!playlist)
        throw new ApiError("Something went wrong in fetching playlist from DB !!", 500);

    return res.status(200).json(new ApiResponse(200, "Playlist updated successfully !!", playlist));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}