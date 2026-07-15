import mongoose from "mongoose";
import "dotenv/config";
export const connectDB = async () => {
  try{

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

