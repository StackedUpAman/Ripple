import mongoose from "mongoose";

export async function ConnectMongoDB(url) {
  return mongoose
    .connect(url)
    .then(() => {
      console.log("MongoDB connected!");
    })
    .catch((err) => {
      console.error("Mongo Error", err);
    });
}

