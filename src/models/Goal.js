import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const GoalSchema = new mongoose.Schema({ 

    startDate: { type: Date },   
    endDate: { type: Date },   
    discipline: { type: String },
    score: { type: Number }, 
    time: { type: Number },
    achieved: { type: Boolean},
    userId: { type: String }
})

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema)
