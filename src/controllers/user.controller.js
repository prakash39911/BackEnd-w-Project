import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessRefreshToken = async function (userId) {
  try {
    const newUser = await User.findById(userId);
    const accessToken = await newUser.generateAccessToken();
    const refreshToken = await newUser.generateRefreshToken();

    newUser.refreshToken = refreshToken;
    newUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  //validation
  //check if user already exist
  //check for images, check for avatar
  // upload them to cloudinary
  // create user object, create entry in DB
  // remove password and refresh token field from response
  //check for user creation
  // return res

  /////////////////////////////////////

  // Receive data from frontend
  const { userName, email, fullName, password } = req.body; // form and Json data comes in the req.body. this feature is definitely provided by express.

  // Validation for isEmpty
  if (
    [userName, email, fullName, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new apiError(400, "All the fields are required");
  }

  // User already exists or not
  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existingUser) {
    throw new apiError(409, "User wih email or username already exist");
  }

  // Files (image ) upload to Local storage using Multer. Multer gives access to req.files.

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // // we can check above condition in another way --
  // let coverImageLocalPathNew;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPathNew = req.files.coverImage[0].path;
  // }

  if (!avatarLocalPath) {
    throw new apiError(400, "avatar local path is not available : multer");
  }

  // file upload to cloudinary, which will give us the link in the response, that we will store it in the database.
  // uploading files to any file upload service provider takes time thats why we are using await. so that only after uploading the files successfully, program will execute further.

  const newavatar = await uploadOnCloudinary(avatarLocalPath);
  const newcoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!newavatar) {
    throw new apiError(400, "avatar image is required to upload on cloudinary");
  }

  // Create user Object, Entry in database(DB)
  const newUser = await User.create({
    fullName,
    avatar: newavatar.url,
    coverImage: newcoverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // Checking if this user is successfully created in the database
  // Whatever entry is created in the database, MongoDB automatically give them a usique id. Which is accessible by _id.
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(
      500,
      "User registration is not complete due to server problem"
    );
  }

  // Return Response
  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take data from (req.body)
  // match if username or email already exist
  //compare password
  //generate access token and refresh token
  // Send Secure cookies (contains access and refresh token)
  //return response

  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new apiError(400, "username or email required to login");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!existedUser) {
    throw new apiError(400, "User does not exist");
  }

  const chkPassword = await existedUser.isPasswordCorrect(password);

  if (!chkPassword) {
    throw new apiError(400, "Incorrect Password");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );

  // by using these options, cookies can be modified only through servers.
  const cookieOption = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption) // cookie(key, value, options)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "You are successfully loggedin"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // find the user using (auth.middleware.js) (ofcourse from the token stored in the user's device, which we can access through (req.cookies))
  //set user's refreshToken to Undefined in the Database
  // Remove cookie (cookie contains access Token and refresh Token) from user's device

  const updatedUser = await User.findByIdAndUpdate(
    // this method on User Model returns user after updating the current user data, so that it must return new updated data.
    req.currentUser._id,
    {
      $set: { refreshToken: "" },
    },
    {
      new: true,
    }
  );

  const cookieOption = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOption)
    .clearCookie("refreshToken", cookieOption)
    .json(new apiResponse(200, {}, "User LoggedOut Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // if someone is using mobile app, for that this code is used -- req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const isUser = await User.findById(decodedToken?._id);

  if (!isUser) {
    throw new apiError(400, "user does not exist");
  }

  if (incomingRefreshToken !== isUser.refreshToken) {
    throw new apiError(400, "user does not exist with the token provided");
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    await generateAccessRefreshToken(isUser._id);

  const cookieOption = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, cookieOption)
    .cookie("refreshToken", newRefreshToken, cookieOption)
    .json(
      new apiResponse(
        200,
        {
          incomingRefreshToken,
          newRefreshToken,
          newAccessToken,
        },
        "Access token refreshed"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const currentUser = await User.findById(req.currentUser._id);

  const isPasswordCorrect = await currentUser.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  currentUser.password = newPassword;

  await currentUser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new apiResponse(200, req.currentUser, "Current user fetched successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "All fields are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.currentUser?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Account details updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.avatar[0].path;

  if (!avatarLocalPath) {
    throw new apiError(400, "new avatar image is not given by the user");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, "Error while uploading avatar on cloudinary");
  }

  const currentNewUser = await User.findById(req.currentUser._id);

  await deleteFromCloudinary(
    // Extracting public_id name from the URL stored in the database. To delete it from the cloudinary.
    currentNewUser.avatar.split("/").slice(-1)[0].split(".").slice(0)[0]
  );

  const updatedUser = await User.findByIdAndUpdate(
    req.currentUser?._id,
    {
      $set: { avatar: avatar.url },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Avatar image updated successfully")
    );
});

// getUserChannelProfile function is written Using mongoDB Aggregation pipelines.

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Collect username from URL, using req.params.
  // Routes will be different from others. coz we are reading username from URL(req.params)
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new apiError(400, "username is missing");
  }

  // after writing aggregate piplelines, we get Values in an Array.
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },

    {
      $lookup: {
        from: "subscriptions", // look into the Subscription model. all the model names will be converted into lowercase and become plural.
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.currentUser?._id, "$subscribers.subscriber"],
              then: true,
              else: false,
            },
          },
        },
      },
    },

    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.currentUser._id),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    userName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory,
};
