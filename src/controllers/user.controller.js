import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError("Something went wrong while generating Access and Refesh Tokens !!", 500)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // Step-1 : Get user details from Frontend
    const { fullName, userName, email, password } = req.body;
    console.log(`Body logging`, req.body);

    // Step-2 : Validation Checks
    if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError("Required fields cannot be empty !!", 400);
    }

    // Step-3 : Check if user already exists in the DB
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existingUser)
        throw new ApiError("User already exists with userName or email !!", 409);

    // Step-4 : Check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
        coverImageLocalPath = req.files.coverImage[0].path;

    console.log(`Files logging : `, req.files);

    if (!avatarLocalPath)
        throw new ApiError("Avatar file is required !!", 400);

    // Step-5 : Upload them to cloudinary, Avatar check since it is required field
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError("Avatar file is required !!", 400);
    }

    // Step-6 : Create user object and create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    // Step-7 : Remove password and refresh token field from response 
    const isUserCreated = await User.findById(user?._id).select("-password -refreshToken");

    // Step-8 : Check for user creation
    if (!isUserCreated)
        throw new ApiError("Something went wrong while registering the User !!", 500);

    // Step-9 : Return the response
    return res.status(201).json(
        new ApiResponse(200, "User registered successfully !! ", isUserCreated)
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // Step-1 : req.body->data
    const { email, username, password } = req.body;

    // Step-2 : username / email
    if (!email && !username)
        throw new ApiError("Username or Email is required !!", 400)

    // Step-3 : find the user
    const user = await User.findOne({ $or: [{ email }, { username }] });

    // Step-4 : Not found throw err
    if (!user)
        throw new ApiError("User does not exists !!", 404)

    // Step-5 : Password matching
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid)
        throw new ApiError("Invalid User Credentials !!", 401)

    // Step-6 : Access and refresh token generate
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // Step-7 : Send cookies
    const options = {
        httpOnly: true,
        secure: true,
    }
    // Step-8 : res.send
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "User logged in successfully !!", {
            user: loggedInUser,

            accessToken,
            refreshToken,
        }))
})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id
    await User.findByIdAndUpdate(userId, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    })
    // Step-1 : Clear all the cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    // Step-2 : Clear the refreshToken of particular user

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out", {}))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken)
        throw new ApiError("Unauthorized Request !!", 401);

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user)
            throw new ApiError("Invalid Refresh Token !!", 401);

        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError("Refresh Token is expired !!", 401);

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user?._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, "Access Token Refreshed !!", {
                    accessToken,
                    refreshToken: newRefreshToken,
                })
            )
    } catch (error) {
        throw new ApiError(error?.message || "Invalid Refresh Token !!", 401)
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword)
        throw new ApiError("Confirm Password must be same as new Password !!", 400);

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect)
        throw new ApiError("Invalid Old Password !!", 400)

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, "Password Changed Successfully !!", {}))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "Current User fetched Successfully !! ", req.user))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError("All fields are required !!", 400)
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName: fullName,
            email: email,
        }
    },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, "Account Details updated successfully !!", user))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath)
        throw new ApiError("Avatar File is Missing !!", 400);

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url)
        throw new ApiError("Error while uploading on Avatar !!", 400)

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated Successfully !! ", user))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath)
        throw new ApiError("Cover Image File is Missing !!", 400);

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url)
        throw new ApiError("Error while uploading on Cover Image !!", 400)

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Cover Image updated Successfully !! ", user))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage }