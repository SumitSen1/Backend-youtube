import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { json } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if (!userId) {
        throw new ApiError(400, "User is not loogedIn")
    }

    const existedUser = await User.findById(userId);
    if (!existedUser) {
        throw new ApiError(400, "User is not found")
    }

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(userId))
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $unwind: "videos"
        },
        {
            $match: {
                ...(query
                    &&
                {
                    "videos.title":
                    {
                        $regex: query,
                        $option: "i"
                    }
                })
            }
        },
        {
            $sort: {
                [`videos.${sortBy}`]: sortType === "asc" ? 1 : -1,
            }
        },
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        {
            $limit: limitNumber
        },
        {
            $group: {
                _id: "$_id",
                videos: { $push: "$videos" }
            }
        }
    ])
    if (!user.length) {
        throw new ApiError(404, "No videos found")
    }
    const videos = user[0].videos

    return res
        .status(200)
        .json(
            new ApiResponse(200
                , {
                    currentPage:
                        pageNumber, totalVideo: videos.length
                },
                videos, "video fetch successfully"))

})
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description, owner, duration } = req.body;

    if (!title) {
        throw new ApiError(401, "Title is required")
    }
    if (!description) {
        throw new ApiError(402, "Description is required")
    }
    const videoLocalpath = req.files?.videoFile[0]?.path;

    if (!videoLocalpath) {
        throw new ApiError(403, "Video is not found")
    }

    const thumbnailLocalpath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalpath) {
        throw new ApiError(404, "Thumbnail is not found")
    }

    const videoFile = await uploadOnCloudinary(videoLocalpath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalpath)

    if (!videoFile) {
        throw new ApiError(405, "Error occur on uplaoding video")
    }
    if (!thumbnailFile) {
        throw new ApiError(405, "Error occur on uplaoding thumbnail")
    }
    const Videodoc = await Video.create({
        title,
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        description,
        url: videoLocalpath.url,
        owner: req.user._id,
        duration
    })

    if (!Videodoc) {
        throw new ApiError(406, "Something went wrong while updating video file")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video published successfully"))
})
const getvideoByid = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId).populate("owner", " name email")

    if (!video) {
        throw new ApiError(401, "video is not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video fetch successfully"))
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!videoId) {
        throw new ApiError(400, "Invalid videoId")
    }

    let updateData = { title, description }

    if (req.file) {

        const thumbnailLocalpath = req.file.path

        if (!thumbnailLocalpath) {
            throw new ApiError(401, "Updated thumbnail are required")
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalpath)

        if (!thumbnail.url) {
            throw new ApiError("Error while uploading thumbnail")
        }

        updateData.thumbnail = thumbnail.url
    }

    const updatedvideo = await Video.findByIdAndUpdate(
        videoId,
        {$set:updateData},
        {new:true,runValidators:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updateData,"Video Upadted successfully"))
})
const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const deletedvideo = await Video.findByIdAndDelete(videoId)

    if(!deletedvideo){
        throw new ApiError(400,"error while deleting video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"Video delete successfully"))
})
const toggleVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if(!videoId){
        throw new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findById(videoId)
    
    if(!video){
        throw new ApiError(400,"video is not found")
    }

    video.isPublished = !video.isPublished;
    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video publish status toggled successfully"))
})

export {getAllVideos,publishVideo,getvideoByid,updateVideo,deleteVideo,toggleVideo}
