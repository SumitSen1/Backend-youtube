import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const userId = req.user?._id

    if(!channelId){
        throw new ApiError(400,"channel is required")
    }
    if(userId.toString()===channelId.toString()){
        throw new ApiError(400,"you cannot substrcibe to your own channel")
    }

    const existingSubs = await Subscription.findOne({
        subscriber :userId,
        channel: channelId
    })

    if(existingSubs){
       //unsubsribe
       await existingSubs.deleteOne();
       return res.status(
        200,channelId,"Unsuscribe successfully"
       )
    }
    await Subscription.create({
        subscriber :userId,
        channel: channelId
    })
    res.status(200).json(
        new ApiResponse(200, null, "Subscribed successfully")
    );
})

const getUserChanneSubsriber = asyncHandler(async(req,res)=>{
    const{channelId} = req.params
})

const getSubsribedChannel = asyncHandler(async(req,res)=>{
    const {subscriberId}= req.params
})

export {toggleSubscription,getUserChanneSubsriber,getSubsribedChannel}