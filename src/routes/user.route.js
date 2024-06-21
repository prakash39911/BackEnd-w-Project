import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
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

router.route("/refresh-token").post(refreshAccessToken);

// here verifyJWT is a middleware fn. that we have created in the middleware folder.
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
