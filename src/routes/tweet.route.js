import { Router } from "express";
import {
    createTweets,
    getUsertweets,
    updateTweets,
    deleteTweets } from "../controllers/tweet.controller";
    
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router()

router.use(verifyJWT)

router.route("/").get(createTweets)
router.route("/user/:userId").get(getUsertweets)
router.route("/:tweetId").patch(updateTweets).delete(deleteTweets)

export default router