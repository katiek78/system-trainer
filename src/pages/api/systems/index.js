import dbConnect from '../../../lib/dbConnect'
import System from '@/models/System'

export default async function handler(req, res) {
  const { method } = req

  await dbConnect()

  switch (method) {
    case 'GET':
      try {
        const systems = await System.find({}) /* find all the data in our database */
        res.status(200).json({ success: true, data: sytems })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    case 'POST':
      try {
        const system = await System.create(
          req.body
        ) /* create a new model in the database */
        res.status(201).json({ success: true, data: system })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    default:
      res.status(400).json({ success: false })
      break
  }
}
