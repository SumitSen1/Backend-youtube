import mongoose,{Schema } from "mongoose";

const playListSchema = new Schema({
    name:{
        type:String ,
        req:true 
    },
    description:{
        type:String,
        req:true
    },
    videos:[
        {
        type:Schema.Types.ObjectId,
        req:"Video"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        req:"User "
    }
},
{timestamps:true})

export const Playlist = mongoose.model("Playlist",playListSchema)