import dotenv from "dotenv"; // We want that as soon as application loads, all of our application can access environment variables. so import it at the TOP.
import connectDB from "./db/connection.js";
import { app } from "./app.js";

dotenv.config();

connectDB() // importing and ruuning DB connection function as soon as entry point file (index.js) starts running.
  .then((response) => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error in connection with the MongoDB", err);
  });
// when we want to establish connection between Our "Backend" code and "Database". Always use "try Catch Block" and use "async await".
// establishing connection to database takes time and there can be some errors while doing so, thats why use try catch block.
// Database are in Another Continent".

// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//     app.on("error", (error) => {
//       console.log("Error occured:", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`Server is listening on ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     throw error;
//   }
// })();
