import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

(async function () {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
})();

const uploadFileOnCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: auto,
    });
    console.log(
      "File has been successfully uploaded to Cloudinary",
      response.url
    );
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the file upload operation got failed.
    return;
  }
};

export { uploadFileOnCloudinary };
