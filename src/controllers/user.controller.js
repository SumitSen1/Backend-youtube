import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

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

export{registerUser}