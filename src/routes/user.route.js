import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// Secured Route
router.route("/login").post(loginUser);

// here verifyJWT is a middleware fn. that we have created in the middleware folder.
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

// We are updating databse partially, so that we have used "patch".
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

// We are taking username from the URL, thats why this route is different from others.
router.route("/c/:userName").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);
export default router;
