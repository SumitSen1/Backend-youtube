import { Router } from "express";
import { getSubsribedChannel,getUserChannelSubsriber ,toggleSubscription } from "../controllers/subscription.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router
.route("/c/:channelId")
.get(getSubsribedChannel)
.post(toggleSubscription)

router.route("/u/:subscriberId").get(getUserChannelSubsriber);

export default router