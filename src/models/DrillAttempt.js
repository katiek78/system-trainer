import mongoose from "mongoose";

const DrillAttemptSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageSetId: { type: String, required: true },
  subsetDescription: { type: String },
  targetTimeSeconds: { type: Number },
  totalTimeSeconds: { type: Number, required: true },
  roundsCompleted: { type: Number, required: true },
  itemsAttempted: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

// Delete the model if it exists to force schema refresh
if (mongoose.models.DrillAttempt) {
  delete mongoose.models.DrillAttempt;
}

export default mongoose.model("DrillAttempt", DrillAttemptSchema);
