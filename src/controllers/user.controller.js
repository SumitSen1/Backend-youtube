import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req , res)=>{
    const{username,email,fullname,password} = req.body
    console.log("username :", username,"\nemail: ",email);
    if(
        [fullname,username,email,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"full fielld are required")
    }
    const existedUser = User.findOne(
    {
        $or:[{ username },{ email }]
    })
    if(existedUser)
    {
        throw new ApiError(409,"user with this userName / email is existed ")
    }
    const avtarLocalPath = req.files?.avtar[0]?.path
    const coverImagePath = req.files?.coverImage[0]?.path
    console.log("avtarLocalPath",avtarLocalPath);

    if(!avtarLocalPath){
        throw new ApiError(400,"avtar is neseccery")
    }
    //upload on cloudnary
    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if(!avtar){
        throw new ApiError(400,"avtar is neseccery")
    }
    const user = await User.create({
        fullname,
        avtar: avtar.url,
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

export{registerUser}