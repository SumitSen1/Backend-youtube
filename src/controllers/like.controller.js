import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Error in video")
    }
    if (!userId) {
        throw new ApiError(400, "User is not loggedIn")
    }

    const existedLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (existedLike) {
        await Like.findByIdAndDelete(existedLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, "Video unlike successfully"))
    }

    const likeVideo = await Like.create({
        video: videoId,
        likedBy: userId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, likeVideo, "videoLiked successfully"))

})
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { CommentId } = req.params
    const userId = req.user._id

    if (!isValidObjectId(CommentId)) {
        throw new ApiError(400, "comment not Found")
    }
    if (!userId) {
        throw new ApiError(400, "user is not loggedIn")
    }

    const existedLike = await Like.findOne({
        comment: CommentId,
        likedBy: userId
    })

    if (existedLike) {
        await Like.findByIdAndDelete(existedLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, "comment Unliked successfully"))
    }

    const newLike = await Like.create({
        comment: CommentId,
        likedBy: userId
    })

    return res
        .status(201)
        .json(new ApiResponse(200, "comment like successfully"))
})
const toggletweetLike = asyncHandler(async (req, res) => {
    const tweetId = req.params
    const userId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Error in tweet")
    }

    const existedLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })
    if (existedLike) {
        await Like.findByIdAndDelete(existedLike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, "tweet disLiked successfully"))
    }
    const newtweetLike = await Like.create({
        tweet: tweetId,
        likedBy: userId
    })
    return res
        .status(201)
        .json(new ApiResponse(200, "tweet Liked successfully"))
})
const getLikedVideo = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likeVideo = await Like.findOne({
        likedBy: userId,
        video: { $exists: true }
    }).populate("video", "_id title url")
    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        );
})

export {toggleCommentLike,toggletweetLike,toggleVideoLike,getLikedVideo}
