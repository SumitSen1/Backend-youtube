import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { json } from "express"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user?._id

    if (!channelId) {
        throw new ApiError(400, "channel is required")
    }
    if (userId.toString() === channelId.toString()) {
        throw new ApiError(400, "you cannot substrcibe to your own channel")
    }

    const existingSubs = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (existingSubs) {
        //unsubsribe
        await existingSubs.deleteOne();
        return res.status(
            200, channelId, "Unsuscribe successfully"
        )
    }
    await Subscription.create({
        subscriber: userId,
        channel: channelId
    })
    res.status(200).json(
        new ApiResponse(200, null, "Subscribed successfully")
    );
})

const getUserChannelSubsriber = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel is not exist")
    }

    const totalSubsriber = await Subscription.find({
        channel: channelId,
    }).populate("subscriber", "_id name email")
    if (!totalSubsriber) {
        throw new ApiError(401, "Subscription list is not found")
    }
    return res
        .status(200)
        , json(new ApiResponse(200, totalSubsriber, "Subscription fetch successfully"))
})


const getSubsribedChannel = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Error in subscriber Id")
    }

    const totalSubsriber = await Subscription.find({
        subscriber: subscriberId,
    }).populate("channel", "_id name email")
    if (!totalSubsriber) {
        throw new ApiError(404, "Channel list is not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                totalSubsriber,
                "Subscribed channels fetched successfully"
            )
        );
})

export { toggleSubscription, getUserChannelSubsriber, getSubsribedChannel }