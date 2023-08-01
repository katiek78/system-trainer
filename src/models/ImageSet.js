import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const ImageSetSchema = new mongoose.Schema({
    name: { type: String},
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
})

export default mongoose.models.ImageSet || mongoose.model('ImageSet', ImageSetSchema)
