import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (
    [name, description].some((ele) => {
      ele?.trim() === "";
    })
  ) {
    throw new apiError(400, "All fields are required");
  }

  const newPlaylist = await Playlist.create({
    name: name,
    description: description,
    owner: req.currentUser._id,
  });

  if (!newPlaylist) {
    throw new apiError(500, "Playlist Creation was not successfull");
  }

  return res
    .status(200)
    .json(new apiResponse(200, newPlaylist, "Playlist Created Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlistDoc = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlistDoc) {
    throw new apiError(500, "Video wasn't added to the playlist");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlistDoc, "Video added to the Playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlistDoc = await Playlist.findById(playlistId);

  if (!playlistDoc) {
    throw new apiError(400, "Playlist does not exist");
  }

  const videoArr = playlistDoc.videos;
  const index = videoArr.indexOf(videoId);
  const updatedVideoArr = videoArr.filter((ele) => ele !== videoArr[index]);

  playlistDoc.videos = updatedVideoArr;

  await playlistDoc.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        playlistDoc.videos,
        "Video Successfully Removed from Playlist"
      )
    );
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userDoc = await User.findById(userId);

  const allPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: userDoc._id,
      },
    },

    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        allPlaylist,
        "All playlist for a given ID is fetched"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlistRetrieved = await Playlist.findById(playlistId);

  if (!playlistRetrieved) {
    throw new apiError(200, "There is no playlist for the given ID");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlistRetrieved, "Playlist Data Fetched"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const deletedResponse = await Playlist.deleteOne({ _id: playlistId });

  if (deletedResponse.deletedCount !== 1) {
    throw new apiError(500, "Playlist was not deleted");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, deletedResponse, "Playlist was deleted Successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { newName, newDescription } = req.body;

  if ([newName, newDescription].some((ele) => ele?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  const playlistDoc = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: { name: newName, description: newDescription },
    },
    {
      new: true,
    }
  );

  if (playlistDoc.modifiedCount == 0) {
    throw new apiError(500, "Modification was not successfull");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        playlistDoc,
        "Playlist name and description was updated successfully"
      )
    );
});

export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getUserPlaylist,
  getPlaylistById,
  deletePlaylist,
  updatePlaylist,
};
