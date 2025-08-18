import { Router } from "express";
import { getAllVideos,
    publishVideo,
    getvideoByid,
    updateVideo,
    deleteVideo,
    toggleVideo
 } from "../controllers/video.controller";

 import { verifyJWT } from "../middlewares/auth.middleware";
 import {upload} from "../middlewares/multer.middleware.js"

 const router = Router()

 router.use(verifyJWT)

 router.
        route("/")
        .get(getAllVideos)
        .post(
            upload.fields([
                {
                    name : videoFile,
                    maxCount :1
                },
                {
                    name : thumbnail,
                    maxCount:1
                },
            ]),
            publishVideo
        );
router
    .route("/:videoId")
    .get(getvideoByid)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"),updateVideo)  
    
router.route("/toggle/publish/:videoId").patch(togglepublishstatus)   

export default router