import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async function () {
  try {
    const connectionInstances = await mongoose.connect(
      `${process.env.MONGODB_URI}${DB_NAME}`
    );

    console.log(
      `\n MongoDB Connected !! DB HOST : ${connectionInstances.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB Connection failure:", error);
    process.exit(1); // Node Syntax
  }
};

export default connectDB;
