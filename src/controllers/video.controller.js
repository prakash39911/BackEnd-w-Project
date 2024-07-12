import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import path from "path";

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.currentUser) {
    throw new apiError(400, "You are not Authorized to upload a video");
  }

  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and Description are mandatory");
  }

  const videoFilePath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;
  console.log(videoFilePath, thumbnailPath);

  if (!videoFilePath || !thumbnailPath) {
    throw new apiError(400, "There is no video file Path");
  }

  const videoCloudResponse = await uploadOnCloudinary(videoFilePath);
  const thumbnailCloudResponse = await uploadOnCloudinary(thumbnailPath);
  console.log(videoCloudResponse, thumbnailCloudResponse);

  if (!videoCloudResponse || !thumbnailCloudResponse) {
    throw new apiError(
      400,
      "There is no response from cloudinary after uploading video"
    );
  }

  const newVideo = await Video.create({
    videoFile: videoCloudResponse.url,
    thumbnail: thumbnailCloudResponse.url,
    title: title,
    description: description,
    duration: videoCloudResponse.duration,
    views: 1, // This is pending.
    isPublished: true,
    owner: req.currentUser._id,
  });

  const videoEntry = await Video.findById(newVideo._id);

  if (!videoEntry) {
    throw new apiError(500, "Video Upload failed");
  }

  return res
    .status(200)
    .json(new apiResponse(200, videoEntry, "Video Successfully Uploaded"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoID } = req.params;

  if (!videoID) {
    throw new apiError(400, "Video ID not Received");
  }

  const videoFound = await Video.findById(videoID);

  if (!videoFound) {
    throw new apiError(400, "Video not found for the particular ID");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        videoFound,
        "Video corresponding to the particular ID"
      )
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  if (!req.currentUser) {
    throw new apiError(400, "You are not authorized to update the video");
  }
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!(videoId || title || description)) {
    throw new apiError(400, "there is no video id");
  }

  const thumbnailPath = req.file?.path;

  if (!thumbnailPath) {
    throw new apiError(400, "there is no new thumbnail file");
  }

  const thumbCloudResponse = await uploadOnCloudinary(thumbnailPath);
  if (!thumbCloudResponse) {
    throw new apiError(
      400,
      "there is no response from cloudinary while uploading new thumbnail file"
    );
  }

  const previousThumbnail = await Video.findById(videoId);
  const previousThumbnailUrl = previousThumbnail.thumbnail;

  const public_id = previousThumbnailUrl
    .split("/")
    .slice(-1)[0]
    .split(".")
    .slice(0)[0];

  await deleteFromCloudinary(public_id);

  const updatedDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbCloudResponse.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, updatedDetails, "Video updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  if (!req.currentUser) {
    throw new apiError(400, "You are not authorised to delete a video");
  }
  const { videoId } = req.query;

  if (!videoId) {
    throw new apiError(400, "Correct Video id is not provided");
  }

  const response = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new apiResponse(200, response, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new apiError(400, "There is no correct video id provided");
  }

  const updatedStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      isPublished: isPublished ? false : true,
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Publish status updated successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

export {
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
