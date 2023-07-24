import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const MemoSystemSchema = new mongoose.Schema({
  name: {
    /* The name of this system */

    type: String,
    required: [true, 'Please provide a name for this system.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  sequence: [
    String
  ],
  imageSets: [
    new mongoose.Schema({
    name: { type: String},
    images: [
        /* List of images */
        new mongoose.Schema({
          name: { type: String},
          imageItem: {type: String},      
        })
      ],
    }),
  ],
  userId: {
    type: String,    
  }
 
})

export default mongoose.models.MemoSystem || mongoose.model('MemoSystem', MemoSystemSchema)
