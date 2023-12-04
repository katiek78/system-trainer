import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const PlanEntrySchema = new mongoose.Schema({ 
    discipline: { type: String },   
    frequency: { type: String, default: 1 }, // how many times per D/M/W you want to do it
    frequencyType: { type: String,
        enum: ['D', 'W', 'M'],
        default: 'D', 
    },
    frequencySpecifics: [ //strings representing days of the week or of the month
    String
  ], 
    userId: {
        type: String  
    }
})

export default mongoose.models.PlanEntry || mongoose.model('PlanEntry', PlanEntrySchema)
