import dbConnect from '../../../lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
    case 'GET' /* Get a model by its ID */:
      try {
        const imageSet = await ImageSet.findById(id)
        if (!imageSet) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: imageSet })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'PUT' /* Edit a model by its ID */:
        console.log("putting")
      try {
        const imageSet = await ImageSet.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        })
        if (!imageSet) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: imageSet })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'DELETE' /* Delete a model by its ID */:
      try {
        const deletedImageSet = await ImageSet.deleteOne({ _id: id })
        if (!deletedImageSet) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: {} })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    default:
      res.status(400).json({ success: false })
      break
  }
}
