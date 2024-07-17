import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add/:videoId").post(addComment).get(getVideoComments);

router.route("/update/:commentId").patch(updateComment).post(deleteComment);

export default router;
