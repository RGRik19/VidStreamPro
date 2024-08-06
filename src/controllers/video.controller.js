import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteImageFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    //Step-1 : Add validations 
    if (!title || !description)
        throw new ApiError("Title and Description are Required Fields !!", 400);
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError("Authorization is Required !!", 401);

    //Step-2 : Get videoFile and thumbnail local path from req.files
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (!thumbnailLocalPath || !videoFileLocalPath)
        throw new ApiError("Thumbnail and Video are Required !!", 400);

    //Step-3 : Upload the videoFile and thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    console.log("Video response : ", videoFile);
    if (!thumbnail || !videoFile)
        throw new ApiError("Something went wrong in uploading to Cloudinary !!", 500);

    //Step-4 : Fetch the duration of the video from Cloudinary response
    const duration = videoFile.duration;

    //Step-5 : Add the video document into the Video model
    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        owner: userId,
        duration,
        isPublished: true,
        views: 0
    })

    if (!video)
        throw new ApiError("Something went wrong in uploading to DB !!, 500");
    //Step-6 : Return the response

    return res
        .status(201)
        .json(new ApiResponse(200, "Video uploaded successfully", video));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId);
    if (!video)
        throw new ApiError("Video not found !!", 400);

    return res.status(200).json(new ApiResponse(200, "Video fetched successfully", video));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    // Title, description, thumbnail fetch from req.body and req.file
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if ([title, description, thumbnailLocalPath].some(field => field?.trim() === ""))
        throw new ApiError("Required fields are empty !!", 400);

    // Add validations and check if the user is loggedin or not
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError("Authorization is required !!", 401);

    // Find the exisiting document using the videoId
    const video = await Video.findById(videoId);
    if (!video)
        throw new ApiError("Video not found !!", 404);

    // Delete the exisiting thumbnail from Cloudinary and upload the new thumbnail
    let thumbnail = video.thumbnail;
    const deletedThumbnail = await deleteImageFromCloudinary(thumbnail);
    if (!deletedThumbnail)
        throw new ApiError("Something went wrong in deleting thumbnail from Cloudinary !!", 500);

    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail)
        throw new ApiError("Something went wrong in uploading thumbnail to Cloudinary !!", 500);

    // Update the various details in the database
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            thumbnail: thumbnail.url
        }
    }, { new: true })

    if (!updatedVideo)
        throw new ApiError("Something went wrong in updating fields !!", 500);

    return res.status(200).json(new ApiResponse(200, "Video details updated Successfully !!", updatedVideo));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // Find the existing document using the videoId
    const video = await Video.findById(videoId);

    if (!video)
        throw new ApiError("Video not found !!", 404);

    // Delete the existing thumbnails and videos from Cloudinary
    const videoFile = video.videoFile;
    const thumbnail = video.thumbnail;
    const deletedVideo = await deleteVideoFromCloudinary(videoFile);
    const deletedThumbnail = await deleteImageFromCloudinary(thumbnail);

    if (!deletedVideo || !deletedThumbnail)
        return new ApiError("Something went wrong in deleting files from Cloudinary !!", 500);

    // Delete the entire document from Database
    const response = await Video.deleteOne({ _id: videoId });
    if (!response)
        throw new ApiError("Something went wrong in deleting from DB!!", 500);

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully !!", {}));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Find the existing document using the videoId
    const video = await Video.findById(videoId);
    if (!video)
        throw new ApiError("Video not found !!", 404);

    // Reverse the isPublished flag from the document 
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: {
                $not: "$isPublished"
            }
        }
    })

    if (!updatedVideo)
        throw new ApiError("Something went wrong in updating Video !!", 500);
    // Return the response

    return res.status(200).json(new ApiResponse(200, "Published status toggled successfully !!", updatedVideo));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}