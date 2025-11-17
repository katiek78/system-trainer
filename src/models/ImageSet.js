import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const ImageSetSchema = new mongoose.Schema({
    name: { type: String},
  setType: { type: String, required: true }, // <-- setType is now a top-level property and required
    images: [
        /* List of images */
        new mongoose.Schema({
          name: { type: String},
          imageItem: {type: String},  
          phonetics: {type: String},
          URL: {type: String},
          recentAttempts: {
            type: [Number],
            default: []
          },
          starred: {type: Boolean}
        })
      ],
    userId: {
        type: String,    
    }
})

export default mongoose.models.ImageSet || mongoose.model('ImageSet', ImageSetSchema)
