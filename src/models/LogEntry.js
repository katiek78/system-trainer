import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const LogEntrySchema = new mongoose.Schema({
    entryDate: { type: Date},
    discipline: { type: String },
    score: { type: Number },
    correct: { type: Number },
    time: { type: Number },
    journey: { type: String },
    notes: { type: String },
    userId: {
        type: String  
    }
})

export default mongoose.models.LogEntry || mongoose.model('LogEntry', LogEntrySchema)
