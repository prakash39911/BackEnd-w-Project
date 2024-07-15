import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT); // apple verifyJWT middleware to all the routes in this file.

router.route("/toggle/:channelId").post(toggleSubscription);

router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

router.route("/channels/:subscriberId").get(getSubscribedChannels);
