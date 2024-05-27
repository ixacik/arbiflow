import mongoose from "mongoose";

export async function connectToDb() {
  try {
    await mongoose.connect(process.env.DATABASE_URL!);
  } catch (error) {
    console.log(error);
  }
}
