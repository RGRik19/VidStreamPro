import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken(); // Await statements are very important whenever talking with DB
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      "Something went wrong while generating Access and Refesh Tokens !!",
      500
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Step-1 : Get user details from Frontend
  const { fullName, userName, email, password } = req.body;

  // Step-2 : Validation Checks
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("Required fields cannot be empty !!", 400);
  }

  // Step-3 : Check if user already exists in the DB
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existingUser)
    throw new ApiError("User already exists with userName or email !!", 409);

  // Step-4 : Check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  )
    coverImageLocalPath = req.files.coverImage[0].path;

  if (!avatarLocalPath) throw new ApiError("Avatar file is required !!", 400);

  // Step-5 : Upload them to cloudinary, Avatar check since it is required field
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError("Avatar file is required !!", 500);
  }

  // Step-6 : Create user object and create entry in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // Step-7 : Remove password and refresh token field from response
  const isUserCreated = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  // Step-8 : Check for user creation
  if (!isUserCreated)
    throw new ApiError(
      "Something went wrong while registering the User !!",
      500
    );

  // Step-9 : Return the response
  return res
    .status(201)
    .json(
      new ApiResponse(200, "User registered successfully !! ", isUserCreated)
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // Step-1 : req.body->data
  const { email, userName, password } = req.body;

  // Step-2 : userName / email
  if (!email && !userName)
    throw new ApiError("Username or Email is required !!", 400);

  // Step-3 : find the user
  const user = await User.findOne({ $or: [{ email }, { userName }] });

  // Step-4 : Not found throw err
  if (!user) throw new ApiError("User does not exists !!", 404);

  // Step-5 : Password matching
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError("Invalid User Credentials !!", 401);

  // Step-6 : Access and refresh token generate
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Step-7 : Send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  // Step-8 : res.send
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully !!", {
        user: loggedInUser,

        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  // Step-1 : Clear all the cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  // Step-2 : Clear the refreshToken of particular user

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError("Unauthorized Request !!", 401);

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError("Invalid Refresh Token !!", 401);

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError("Refresh Token is expired !!", 401);

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access Token Refreshed !!", {
          accessToken,
          refreshToken: refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(error?.message || "Invalid Refresh Token !!", 401);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    throw new ApiError("Confirm Password must be same as new Password !!", 400);

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError("Invalid Old Password !!", 400);

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully !!", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Current User fetched Successfully !! ", req.user)
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError("All fields are required !!", 400);
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Account Details updated successfully !!", user)
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  //TODO :- Delete the already stored file from Cloudinary of the current user before updating its new URL

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError("Avatar File is Missing !!", 400);

  const avatar = uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url)
    throw new ApiError("Error while uploading on Avatar !!", 400);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated Successfully !! ", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  //TODO :- Delete the already stored file from Cloudinary of the current user before updating its new URL
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath)
    throw new ApiError("Cover Image File is Missing !!", 400);

  const coverImage = uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url)
    throw new ApiError("Error while uploading on Cover Image !!", 400);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image updated Successfully !! ", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) throw new ApiError("Invalid User Name !!", 400);

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $condition: {
            if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        userName: 1,
        fullName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError("Channel not Found !!", 404);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User channel Fetched Successfully !!", channel[0])
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id : req.user._id, // We have to pass as a MongoDB id and not as a String
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch History Fetched Successfully !!",
        user[0].watchHistory
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
