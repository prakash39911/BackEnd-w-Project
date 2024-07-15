import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriptionDoc = await Subscription.aggregate([
    {
      $match: {
        subscriber: req.currentUser._id,
        channel: channelId,
      },
    },
  ]);

  if (subscriptionDoc?.length === 1) {
    await Subscription.deleteOne({ _id: subscriptionDoc[0]._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Unsubscribed Successfully"));
  }

  if (subscriptionDoc?.length === 0) {
    const newSubscription = await Subscription.create({
      subscriber: req.currentUser._id,
      channel: channelId,
    });

    const newDocumentAdded = await Subscription.findById(newSubscription._id);

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          newDocumentAdded,
          "Successfully Subscribed to the Channel"
        )
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriber = await User.aggregate([
    {
      $match: {
        _id: channelId,
      },
    },

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              subscriber: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        fullName: 1,
        subscribers: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, subscriber, "Subscriber list fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const channelSubscribed = await User.aggregate([
    {
      $match: {
        _id: subscriberId,
      },
    },

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "channelSubscribedTo",
        pipeline: [
          {
            $project: {
              channel: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        channelSubscribedTo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, channelSubscribed, "List of channels Subscribed")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
