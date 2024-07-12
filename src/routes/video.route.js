import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

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

router
  .route("/c/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/delete").post(verifyJWT, deleteVideo);

export default router;
