import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    console.log("File is uploaded on Cloudinary");
    // console.log(response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteVideoFromCloudinary = async (cloudinaryURL) => {
  try {
    if (!cloudinaryURL)
      return null;
    const publicId = getPublicId(cloudinaryURL);
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video"
    })

    console.log("File deleted from Cloudinary");
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
}

const deleteImageFromCloudinary = async (cloudinaryURL) => {
  try {
    if (!cloudinaryURL)
      return null;
    const publicId = getPublicId(cloudinaryURL);
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    })

    console.log("File deleted from Cloudinary");
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
}

const getPublicId = (cloudinaryURL) => {
  const urlSplits = cloudinaryURL.split('/');
  const publicId = urlSplits[urlSplits.length - 1].split('.')[0];
  return publicId;
}

export { uploadOnCloudinary, deleteVideoFromCloudinary, deleteImageFromCloudinary };
