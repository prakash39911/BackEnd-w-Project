// we are defining our own Middleware-- which finds the current loggedIn user through accessToken and add into (req) object.

import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header(Authorization)?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Token not found");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const currentUser = await User.findById(decodedToken?._id).select(
      "-password, -refreshToken"
    );

    if (!currentUser) {
      throw new apiError(401, "User not found from the the access token");
    }

    req.currentUser = currentUser; // we are adding current loggedin User data in the (req) object. so that it helps us to logout the current loggedIn user.
    next();
  } catch (error) {
    throw new apiError(500, "User retrieval from Token failed");
  }
});
