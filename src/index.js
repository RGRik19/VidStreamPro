// require("dotenv").config({ path: "./env" }); Breaks the consistency of our code
import dotenv from "dotenv";
import connectToDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectToDB();

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR : ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("App is listening on PORT : ", process.env.PORT, "");
    });
  } catch (error) {
    console.error("ERROR : ", error);
    throw error;
  }
})();
*/
