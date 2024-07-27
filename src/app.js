import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // allow all origins
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true, // Used for nested  objects
    limit: "1mb",
  })
);

app.use(express.static("public")); // Fetch static files and assets from public named folder

app.use(cookieParser());

// Routes
import userRouter from "./routes/user.routes.js";


// Routes declaration
app.use("/api/v1/users", userRouter);


export { app };
