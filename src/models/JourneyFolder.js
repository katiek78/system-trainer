import mongoose from "mongoose";

const JourneyFolderSchema = new mongoose.Schema({
  name: { type: String },
  userId: { type: String },
});

export default mongoose.models.JourneyFolder ||
  mongoose.model("JourneyFolder", JourneyFolderSchema);
