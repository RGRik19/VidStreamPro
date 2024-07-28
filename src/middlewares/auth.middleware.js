import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!accessToken)
            throw new ApiError("Unauthorized Request !!", 401)

        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            // Discuss about frontend
            throw new ApiError("Invalid Access Token !!", 401)
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(error?.message || "Invalid Access Token !!", 401)
    }
})