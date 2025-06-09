import { Router} from "express";
import { loginUser, logOutUser, registerUser ,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUserAccountDeatails, updatedUserAvatar, updatedUserCoverImage, getUserChannalprofile, getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

//http://localhost:8000/api/v1/users/register



router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

    router.route("/login").post(loginUser)
    //secured route
    router.route("/logout").post(verifyJWT,  logOutUser)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    router.route("/current-user").get(verifyJWT,getCurrentUser)
    router.route("/update-account").patch(verifyJWT,updateUserAccountDeatails)
    router.route("/avatar").patch(verifyJWT, upload.single("avatar"),updatedUserAvatar)
    router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),updatedUserCoverImage)
    router.route("/c/:username").get(verifyJWT,getUserChannalprofile)
    router.route("/history").get(verifyJWT,getWatchHistory)




export default router;