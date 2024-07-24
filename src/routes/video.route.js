import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// router.use(verifyJWT); // Use verifyJWT middleware to all the routes in this file.

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo
);

// router.route("/c/:_id").get(getVideoById);

router.route("/get/:videoID").get(verifyJWT, getVideoById);

router
  .route("/update/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/delete/:videoId").post(verifyJWT, deleteVideo);

router.route("/changeStatus/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/getallvideo").get(verifyJWT, getAllVideos);

export default router;
