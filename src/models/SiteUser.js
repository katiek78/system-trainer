import mongoose from 'mongoose'

/* UserSchema will correspond to a collection in your MongoDB database. */
const SiteUserSchema = new mongoose.Schema({
  // name: {
  //   /* The name of this user */

  //   type: String,
  //   required: [true, 'Please enter your name.'],
  //   maxlength: [60, 'Name cannot be more than 60 characters'],
  // },
  // nickname: {
  //   type: String,
  //   required: [false],
  //   maxlength: [60, 'Nickname cannot be more than 60 characters'],
  // },
  // email: {
  //   type: String,
  //   required: [true, 'Please enter your e-mail address.'],
  //   maxlength: [120, 'Email cannot be more than 120 characters'],
  // }
  userId: {
    type: String,    //corresponds to the userId from the auth0 storage
  },  
  userName: {
    type: String
  }
})

export default mongoose.models.SiteUser || mongoose.model('SiteUser', SiteUserSchema)
