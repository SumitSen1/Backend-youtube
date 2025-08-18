import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "name and description are required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(401, "Error occur while create playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"))

})
const getUserplaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "userId in invalid")
    }

    const playList = await Playlist.find({ owner: userId });

    if (!playList) {
        throw new ApiError(400, "Error occur while finding playlist")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playList, "User playlist fetch successfully"))

})
const getplayListByid = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(401, "PLaylist not found")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    if (!playlist) {
        throw new ApiError(401, "PLaylist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playList fetch successfully"))
})
const addVideoToplaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId not found")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId not found")
    }

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
                //new keyword is removed
            }
        },
        {
            $addFields: {
                videos: {
                    $setUnion: ["videos", [new mongoose.Types.ObjectId(videoId)]]
                }
            }
        },
        {
            $merge: {
                into: "playlists"
            }
        }
    ])

    if (!updatedPlaylist) {
        throw new ApiError(402, "playlist not found or video already added")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "video added to playlist successfully"))
})
const removeVideoFromplayList = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId and videoId")
    }
    const updatePlaylist = await Playlist.findByIdAndDelete(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        { new: true }
    )
    if (!updatePlaylist) {
        throw new ApiError(401, "Error found while deleting video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video removed from playlist successfully"))
})
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const deletedplaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletedplaylist) {
        throw new ApiError(400, "Error occur while delete playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedplaylist, "playList delete successfully"))
})
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }
    if (!name || !description) {
        throw new ApiError(400, "name and description reqired")
    }

    const updatedPlaylistId = await Playlist.findByIdAndUpdate(
        playlistId,
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

    if (!updatedPlaylistId) {
        throw new ApiError(400, "Error occure while update playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylistId, "playList updated successfully"))
})

export {
    createPlaylist,
    getUserplaylists,
    getplayListByid,
    addVideoToplaylist,
    removeVideoFromplayList,
    deletePlaylist,
    updatePlaylist
}