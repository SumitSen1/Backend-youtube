import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweets = asyncHandler(async(req,res)=>{
    const {content} = req.body ;
    const userId  = req.user._id;

    if(!content){
        throw new ApiError(400,"content should not be empty")
    }
    if(!userId){
        throw new ApiError(401,"user is not loggedIn")
    }

    const newtweet = await Tweet.create({
        user: userId,
        content
    })

    if(!newtweet){
        throw new ApiError(402,"tweet is not found")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,"tweet created successfully"))
})
const getUsertweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"user first loggedIn")
    }

    const getTweets = await Tweet.find({
        owner : req.user._id
    }).sort({createdAt : -1})

    if(!getTweets){
       throw new ApiError(401,"Tweet are not found") 
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"Tweet fetch successfully"))
})
const updateTweets = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;
    const userId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(401,"Error in tweet")
    }

    if(tweet.owner.toString()!==userId.toString()){
        throw new ApiError(402,"you can only update your own tweet")
    }
     
    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {
            new : true
        }
    )

    if(!updateTweet){
        throw new ApiError(402,"Something went wrong while updating a tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"Tweet update successfully"))
})
const deleteTweets = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet")
    }
    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(401,"tweet not found")
    }
    if(tweet.owner.toString()!==userId.toString()){
        throw new ApiError(402,"User can delete their own tweet")
    }

    const deleteTweet = Tweet.findByIdAndUpdate(tweetId);
    if(!deleteTweet){
        throw new ApiError(401,"Something went wrong by deleting tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"tweet deleted successfully"))
})

export {createTweets,getUsertweets,updateTweets,deleteTweets}