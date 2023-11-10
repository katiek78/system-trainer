import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const MemoSystemSchema = new mongoose.Schema({
  name: {
    /* The name of this system */
    type: String,
    required: [true, 'Please provide a name for this system.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  imageSets: [ //array of IDs of imageSets included in this system
    String
  ], 
  journeys: [ //array of IDs of journeys included nin this system
    String
  ], 
  userId: {
    type: String,    
  }
 
})

export default mongoose.models.MemoSystem || mongoose.model('MemoSystem', MemoSystemSchema)
