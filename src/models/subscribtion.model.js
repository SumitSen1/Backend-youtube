import mongoose , {Schema} from "mongoose";
import { User } from "./user.models";

const SubscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,//one eho is subscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref:"User" 
    }

},{timestamps: true})

export const Subscription = mongoose.model("Subscription", SubscriptionSchema)