import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    console.log(
      `\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`
    ); // Check the entire object of the connection instance
  } catch (error) {
    console.error(`MongoDB Connection Failed : ${error}`);
    process.exit(1); // Check the other status codes of process.exit()
  }
};

export default connectToDB;
