import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { commentString } = req.body;

  if (!commentString?.trim()) {
    throw new apiError(400, "Please provide Valid Comment");
  }

  const newComment = await Comment.create({
    content: commentString,
    video: videoId,
    owner: req.currentUser._id,
  });

  const isComment = await Comment.findById(newComment._id);

  if (!isComment) {
    throw new apiError(500, "Comment was not added");
  }

  return res
    .status(200)
    .json(new apiResponse(200, newComment, "Comment was added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newString } = req.body;

  if (!newString?.trim()) {
    throw new apiError(
      400,
      "Please provide Valid comment for it to be updated"
    );
  }

  const response = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: newString,
      },
    },
    {
      new: true,
    }
  );

  if (!response) {
    throw new apiError(500, "Comment was not updated");
  }

  return res
    .status(200)
    .json(new apiResponse(200, response, "Comment was updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const response = await Comment.deleteOne({ _id: commentId });

  if (response.deletedCount !== 1) {
    throw new apiError(
      500,
      "comment was not deleted due to internal server error"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment was deleted successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const commentAddedOnVideoDocument = await Video.aggregate([
    {
      $match: {
        _id: videoId,
      },
    },

    {
      $lookup: {
        from: "comments",
        localField: "videoId",
        foreignField: "video",
        as: "commentsArray",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerArray",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              ownerDetails: {
                $first: "$ownerArray",
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
        commentAddedOnVideoDocument[0].commentsArray,
        "Commenst Retrieved Successfully for a given video"
      )
    );
});

export { addComment, updateComment, deleteComment, getVideoComments };