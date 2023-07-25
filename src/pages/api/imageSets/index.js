import dbConnect from '../../../lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
  const { method } = req

  await dbConnect()

  switch (method) {
    case 'GET':
      try {
        const imageSets = await ImageSet.find({}) /* find all the data in our database */
        res.status(200).json({ success: true, data: imageSets })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    case 'POST':
      try {
        const imageSet = await ImageSet.create(
          req.body
        ) /* create a new model in the database */
        res.status(201).json({ success: true, data: imageSet })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    default:
      res.status(400).json({ success: false })
      break
  }
}
