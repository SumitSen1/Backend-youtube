import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"; 
import { User } from "../models/user.models.js ";
export const verifyJWT = asyncHandler(async(req, res ,next)=>{
  try {
     const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
      console.log("auth.middleware/TOKEN",token);
      
     if(!token){
      throw new ApiError(401,"Unauthorization request")
     }
  
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      
     const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")
     if(!user){
      throw new ApiError(401,"invalid access token")
     }
     req.user = user;
     next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})