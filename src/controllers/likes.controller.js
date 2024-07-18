import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new apiError(400, "Video id provided is not valid");
  }

  const likeAlreadyExist = await Like.findOne({
    likedBy: req.currentUser._id,
    video: videoId,
  });

  if (likeAlreadyExist) {
    await Like.findOneAndDelete({
      likedBy: req.currentUser?._id,
      video: videoId,
    });

    return res
      .status(200)
      .json(new apiResponse(200, {}, "You removed your like on the Video"));
  } else {
    const newLike = await Like.create({
      likedBy: req.currentUser?._id,
      video: videoId,
    });

    const isLike = await Like.findById(newLike._id).select("-comment -tweet");

    if (!isLike) {
      throw new apiError(500, "Video is not liked due to server errors");
    }

    return res
      .status(200)
      .json(new apiResponse(200, isLike, "Video is liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new apiError(400, "Comment id provided is not a valid one");
  }

  const isCommentLikeExist = await Like.findOne({
    comment: commentId,
    likedBy: req.currentUser?._id,
  });

  if (!isCommentLikeExist) {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: req.currentUser?._id,
    });

    const isCreated = await Like.findOne({ _id: newLike._id }).select(
      "-video -tweet"
    );

    if (!isCreated) {
      throw new apiError(500, "Comment Like was not Successfull");
    }

    return res
      .status(200)
      .json(200, isCreated, "Comment like was saved in the database");
  } else {
    const response = await Like.findOneAndDelete({
      comment: commentId,
      likedBy: req.currentUser._id,
    });

    if (!response) {
      throw new apiError(500, "Comment like was not deleted successfully");
    }

    return res
      .status(200)
      .json(200, {}, "Like on the comment was deleted from the database");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new apiError(400, "Tweet id is not valid");
  }

  const isTweetLikeExist = await Like.findOne({
    tweet: tweetId,
    likedBy: req.currentUser._id,
  });

  if (!isTweetLikeExist) {
    const newLike = await Like.create({
      likedBy: req.currentUser._id,
      tweet: tweetId,
    });

    const isCreated = await Like.findById(newLike._id).select(
      "-video -comment"
    );

    if (!isCreated) {
      throw new apiError(500, "there is a problem while saving tweet like");
    }

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          isCreated,
          "Tweet like has been saved in the document"
        )
      );
  } else {
    const deletedResponse = await Like.findOneAndDelete({
      likedBy: req.currentUser._id,
      tweet: tweetId,
    });

    if (!deletedResponse) {
      throw new apiError(500, "removing tweet like was NOT Successfull");
    }

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          {},
          "tweet like has been deleted from the database"
        )
      );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  if (!req.currentUser._id) {
    throw new apiError(400, "User is not loggedIn");
  }

  const likedVideosDoc = await Like.aggregate([
    {
      $match: {
        likedBy: req.currentUser?._id,
      },
    },
  ]);

  if (likedVideosDoc?.length === 0) {
    throw new apiError(400, "There is no liked videos for a particular User");
  }

  return res
    .status(200)
    .json(200, likedVideosDoc, "All Videos liked by a loggedIn user");
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
