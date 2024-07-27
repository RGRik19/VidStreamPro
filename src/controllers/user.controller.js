import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // Step-1 : Get user details from Frontend
    const { fullName, userName, email, password } = req.body;
    console.log(req.body);

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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


export { registerUser }