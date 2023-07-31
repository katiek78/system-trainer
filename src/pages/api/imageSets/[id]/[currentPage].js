import dbConnect from '../../../../lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
  const {
    query: { id, currentPage },
    method,
  } = req

  await dbConnect()

  switch (method) {
    case 'GET' /* Get imageSet by ID and return only relevant page */:
      try {
        //  console.log(currentPage)
        const imageSet = await ImageSet.findOne({ _id: id }, { images: { $slice: [currentPage * 20, 20] } })
        // console.log(imageSet)
        if (!imageSet) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: imageSet })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'PUT' /* Update only the images where we have an image with matching ID */:
      try {

        const updateOperations = req.body.images.map(image => ({
          updateOne: {
            filter: { _id: id, "images._id": image._id },
            update: { $set: { "images.$": image } }
          }
        }));

        const changes = await ImageSet.bulkWrite(updateOperations);


        if (!changes) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: changes })
      } catch (error) {

        res.status(400).json({ success: false })
      }
      break

    default:
      res.status(400).json({ success: false })
      break
  }
}
