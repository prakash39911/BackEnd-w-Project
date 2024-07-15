import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUsersTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(createTweet);

router.route("/getUserTweet").get(getUsersTweet);

router.route("/update").patch(updateTweet);

router.route("/delete/:tweetId").post(deleteTweet);

export default router;
