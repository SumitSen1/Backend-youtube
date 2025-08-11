import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getVideoComments =asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {page=1,limit=10}= req.query

    if(!isValidObjectId){
        throw new ApiError(400,"Invalid Video Id ")
    }

    console.log("VideoId " ,videoId,  " type of video", typeof videoId);

    const VideoObjectId = new mongoose.Types.ObjectId(videoId);

    const comments = await Comment.aggregate([
        {
            $match:{
                video :VideoObjectId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"commentOnWhichVideo"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerComment"
            }
        },
        {
            $project:{
                content:1,
                owner:{
                    $arrayElemAt:["$ownerCommnent",0]
                },
                video:{
                    $arrayElemAt:["$commentOnWhichVideo",0]
                },
                createdAt:1,
            }
        },
        {
            $limit:parseInt(limit)
        },
        {
            $skip:(page-1)*parseInt(limit)
        }
    ])
    console.log(comments);    
    if(!comments?.length){
        throw new ApiError(404,"commnets are not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"comments fetch succesfully"))
})
const addComment = asyncHandler(async (req,res)=>{
    const { videoId } = req.params
    const { content } = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(402,"Error in requested VIDEO")
    }
    //if(content.length===0)then..
    if(!content){
        throw new ApiError(403, "There is no content in comment")
    }
    if(!req.user){
        throw new ApiError(404,"User need to logged IN")
    }

    const AddComment = await Comment.create({
        content,
        owner:req.user?.id,
        video:videoId
    })
    if(!AddComment){
        throw new ApiError(500,"something wrong while adding comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,addComment,videoId,"Comment Add successfully"))

})
const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const {content}= req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment Id")
    }
    if(!req.user){
        throw new ApiError(401,"user is not logged In")
    }
    if(!content){
        throw new ApiError(404,"comment cannot be Empty")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id : commentId,
            owner:req.user._id
        },
        {
            $set:{content}
        },
        {new:true}
    )
    if(!updateComment){
        throw new ApiError(400,"something went wrong while updating comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateComment,"comment update successfully"))
})
const deleteComment =asyncHandler(async(req,res)=>{
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"commentId is not Valid")
    }
    if(!req.user){
        throw new ApiError(400,"user is loggedIn")
    }
    const commentDelete = await Comment.findOneAndDelete(
        {
            _id: commentId,
            owner: req.user._id
        }
    )
    if(!commentDelete){
        throw new ApiError(400,"Error while deleting comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,commentDelete,"Comment delete successfully"))
})

export {getVideoComments,addComment,updateComment,deleteComment}