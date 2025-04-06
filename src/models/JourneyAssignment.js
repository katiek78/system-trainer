import mongoose from "mongoose";

/* JourneySchema will correspond to a collection in your MongoDB database. */
const JourneyAssignmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  discipline: {
    type: String,
    required: true,
  },
  journeySets: [
    {
      journeyIDs: {
        type: [String],
        required: true,
      },
    },
  ],
});

export default mongoose.models.JourneyAssignment ||
  mongoose.model("JourneyAssignment", JourneyAssignmentSchema);
