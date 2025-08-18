import { Router } from "express";
import {createPlaylist,
    getUserplaylists,
    getplayListByid,
    addVideoToplaylist,
    removeVideoFromplayList,
    deletePlaylist,
    updatePlaylist} from "../controllers/playlist.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";
 
const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId")
.get(getplayListByid)
.patch(updatePlaylist)
.delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToplaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromplayList)

router.route("/user/:userId").get(getUserplaylists)

export default router