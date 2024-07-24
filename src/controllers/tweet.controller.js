import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { tweetString } = req.body;

  if (!tweetString?.trim()) {
    throw new apiError(
      400,
      "Please Provide Valid Content to publish it as a Tweet"
    );
  }

  const newTweet = await Tweet.create({
    owner: req.currentUser._id,
    content: tweetString,
  });

  if (!newTweet) {
    throw new apiError(500, "Server Side error while creating new Tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, newTweet, "Tweet Created Successfully"));
});

const getUsersTweet = asyncHandler(async (req, res) => {
  if (!req.currentUser) {
    throw new apiError(400, "User is not LoggedIn");
  }

  const UserTweet = await User.aggregate([
    {
      $match: {
        _id: req.currentUser._id,
      },
    },

    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweetsArr",
        pipeline: [
          {
            $project: {
              content: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        fullName: 1,
        tweetsArr: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        UserTweet,
        "User's tweet has been fetched successfully"
      )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { newTweetToBeUpdated } = req.body;

  if (!newTweetToBeUpdated?.trim()) {
    throw new apiError(400, "Please provide valid string to update your tweet");
  }

  const updatedTweetDoc = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: newTweetToBeUpdated,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, updatedTweetDoc, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const response = await Tweet.deleteOne({ _id: tweetId });

  if (response.deletedCount !== 1) {
    throw new apiError(500, "Error while deleting Tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted Successfully"));
});

export { createTweet, getUsersTweet, updateTweet, deleteTweet };
