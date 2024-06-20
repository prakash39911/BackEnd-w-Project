import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import multer from "multer";

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

  // Files (image ) upload to Local storage using Multer

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(req.files);
  if (!avatarLocalPath) {
    throw new apiError(400, "avatar image is required multer");
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
    avatar: avatar.url,
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

export { registerUser };
