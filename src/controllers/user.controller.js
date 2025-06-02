import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

const generateRefreshAndAccessToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token")

    }
}

const registerUser = asyncHandler( async(req , res)=>{
    const{username,email,fullname,password} = req.body
    console.log("username :", username,"\nemail: ",email);
    if(
        [fullname,username,email,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"full fielld are required")
    }
    const existedUser = await User.findOne(
    {
        $or:[{ username },{ email }]
    })
    if(existedUser)
    {
        throw new ApiError(409,"user with this userName / email is existed ")
    }
    console.log("Avatar path:", req.files?.avatar?.[0]?.path);
    console.log("File exists?", fs.existsSync(req.files?.avatar?.[0]?.path));

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImagePath = req.files?.coverImage?.[0]?.path
    console.log("avatarLocalPath",avatarLocalPath);

    //extra
    console.log("Avatar exists?", fs.existsSync(avatarLocalPath));

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is neseccery")
    }
    //upload on cloudnary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    // console.log("upload successfully");
    console.log(req.files);
    
    
    if(!avatar){
        throw new ApiError(400,"avatar is neseccery")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // checking user is made or not
    const usercreated = await User.findById(user._id).select(
        "-password -refreshtoken"
    )
    if(!usercreated){
        throw new ApiError(500, "something went wrong while registring the user")
        
    }
    return res.status(201).json(
        new ApiResponse(200,usercreated , "user register Successfully ")
    )
}) 
const loginUser = asyncHandler(async (req,res)=>{
    const {username , email,password} = req.body

    if(!username || !email){
    throw new ApiError(400,"username or email is required ")
}

    const user = await User.findOne({
        $or: [{email,username}]
    })
    if (!user) {
        throw new ApiError(404,"user does not exist")
    }
    const isPasswordvalid = await user.isPasswordCorrect(password)
    
    if(!isPasswordvalid){
        throw new ApiError(401,"your password is not incorrect ")
    }
    const {accessToken,refreshToken} = await generateRefreshAndAccessToken(user._id)
     
    const loggedinUser = await User.findById(user._id).select("-password , -refreshtoken ")
     
    const options={ 
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user: accessToken,refreshToken,loggedinUser
            },
            "User LoggedIn successfully "
        )
    )
})
const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
     const options={ 
        httpOnly : true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{}, "user logged out successfully")
    )
})



export{
    registerUser,
    loginUser ,
    logOutUser
}