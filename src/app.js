import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors(
    // app.use mainly used for Middleware or configurations. cors -- Cross Origin., this is used to allow url or address from which (Front-end application url or port) our database will be connected.
    {
      origin: process.env.CORS_ORIGIN,
    }
  )
);

app.use(express.json({ limit: "15kb" })); // we can accept json data, max limit is 15kb.
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // this is used when data is coming from URl, so that express can process it by decoding the URL.

app.use(express.static("public")); // we are providing a public folder to users, they can store files or use it (like storing files temporarily)
app.use(cookieParser()); // using it we can store Cookie in user devices(mob, desktop) and performs CRUD operations on it. (e.g. create, update or delete)

export { app };
