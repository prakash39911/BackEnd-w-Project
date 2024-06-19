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

    coverimage: {
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

  this.password = bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// JWT is a Bearer Token. Means it grants access to resources solely based on its possession.
// means whoever has the token has access to the resources.

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
