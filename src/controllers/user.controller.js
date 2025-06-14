import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"
import jwt from "jsonwebtoken"
import { channel, subscribe } from "diagnostics_channel";
import mongoose from "mongoose";

const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        console.log(accessToken);
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { username, email, fullname, password } = req.body

    console.log("username :", username, "\nemail: ", email);
    if (
        [fullname, username, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "full field are required")
    }
    console.log(username, email);

    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        })
        new ApiResponse(200, "lkj", existedUser);
    if (existedUser) {
        throw new ApiError(409, "user with this userName / email is existed ")
    }
    console.log("Avatar path:", req.files?.avatar?.[0]?.path);
    console.log("File exists?", fs.existsSync(req.files?.avatar?.[0]?.path));

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImagePath = req.files?.coverImage?.[0]?.path
    console.log("avatarLocalPath", avatarLocalPath);

    //extra
    console.log("Avatar exists?", fs.existsSync(avatarLocalPath));

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is neseccery")
    }
    //upload on cloudnary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    // console.log("upload successfully");
    console.log(req.files);


    if (!avatar) {
        throw new ApiError(400, "avatar is neseccery")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // checking user is made or not
    const usercreated = await User.findById(user._id).select(
        "-password -refreshtoken"
    )
    if (!usercreated) {
        throw new ApiError(500, "something went wrong while registring the user")

    }
    return res.status(201).json(
        new ApiResponse(200, usercreated, "user register Successfully ")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body
    // console.log(email,username , password);


    if (!username && !email) {
        throw new ApiError(400, "username or email is required ")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log("User detail",user);


    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        throw new ApiError(401, "your password is not incorrect ")
    }
    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user:  refreshToken,accessToken, loggedinUser
            },
                "User LoggedIn successfully "
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "user logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingAccessToken) {
        throw ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw ApiError(401, "Invalid refresh token")
        }
        if (incomingAccessToken !== user?.refreshToken) {
            throw ApiError(401, "Refresh Token and expired or used")
        }

        const option = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateRefreshAndAccessToken(user._id)
        return res
            .status(200)
            .cookie("Access token", accessToken, option)
            .cookie("Refresh token", newrefreshToken, option)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token refresh"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { newPassword, oldPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password change"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fatched successfully"))
})

const updateUserAccountDeatails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "all field are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account detail updated successfully"))

})

const updatedUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar is updated successfully"))
})

const updatedUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is missing")
    }

    //TODO delete old image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage is updated successfully"))
})

const getUserChannalprofile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is not found")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                SubscriberCount: {
                    $size: "$subscribers",
                },
                channelSubscribeTocount: {
                    $size: "$subscribedTo"
                },
                IsSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                email: 1,
                username: 1,
                SubscriberCount: 1,
                channelSubscribeTocount: 1,
                IsSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])

    console.log(channel);
    
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fatch successfully")
        )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
             
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watchHistory fatch successfully"
        )
    )
})



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAccountDeatails,
    updatedUserAvatar,
    updatedUserCoverImage,
    getUserChannalprofile,
    getWatchHistory
}