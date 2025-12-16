import mongoose from "mongoose";

//Schema
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    anion_key: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

//making model using schema
export const User = mongoose.model("Registered_Users", UserSchema);