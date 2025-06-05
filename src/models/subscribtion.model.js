import mongoose , {Schema} from "mongoose";

const SubscriptionSchema = new Schema({},{timestamps: true})

export const Subscription = mongoose.model("Subscription", SubscriptionSchema)