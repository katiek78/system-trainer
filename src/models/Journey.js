import mongoose from 'mongoose'

/* JourneySchema will correspond to a collection in your MongoDB database. */
const JourneySchema = new mongoose.Schema({
  name: {
    /* The name of this journey */

    type: String,
    required: [true, 'Please provide a name for this journey.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  points: [
    /* List of journey points */
    new mongoose.Schema({
      name: { type: String},
      location: {type: String},
      heading: {type: Number},
      pitch: {type: Number},
      fov: {type: Number},
      memoItem: {type: String}
    })
  ],
  image_url: {
    /* Url to city image */
    required: [false],
    type: String,
  },
})

// const PointSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   location: {
//     type: String
//   }
// });

export default mongoose.models.Journey || mongoose.model('Journey', JourneySchema)
