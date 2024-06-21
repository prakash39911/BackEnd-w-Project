import mongoose from "mongoose";
import bcrypt from "bcrypt"; // used to encrypt the password.
import jwt from "jsonwebtoken"; // used to make Tokens.

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // if want some specific data to be precisely searchable, index property is used. it makes the database slow, so use it only for necessary fields.
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String, // Cloudinary link
      required: true,
    },

    coverImage: {
      type: String, // Cloudinary link
    },

    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId, // Watch history will be stored in an array, which is linked to Video Model. this is how we link them.
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Password encryption is long running task, thats why we use async fn here.
// next() is typically used in middleware to pass control to the next middleware fn in the stack.

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT (json web Token) is a Bearer Token. Means it grants access to resources solely based on its possession.
// means whoever has the token has access to the resources.
// access token - short lived, refresh token (Session Token )- long lived
// user do not have to provide username and password again and again, that is why refresh token is used.
// for example, we have given user access for 15min through access token, after 15mnt when user is about to be logged out automatically, user can demand for access token again. As user already have refresh token in their device, frontend developer can send refresh token to the server, and ask for access token again. we as a backend developer will match that refresh Token that is already stored in our database.if refresh token matches, we will generate access token again and provide it to the user for extended logged IN.

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.userName,
      fullname: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema); // Model name in database will be "users"
