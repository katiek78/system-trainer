import dbConnect from '../../../lib/dbConnect'
import Journey from '@/models/Journey'

export default async function handler(req, res) {
  const { method } = req

  await dbConnect()

  switch (method) {
    case 'GET':
      try {
        const journeys = await Journey.find({}) /* find all the data in our database */
        res.status(200).json({ success: true, data: journeys })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    case 'POST':
      console.log(req.body)
      try {
        const journey = await Journey.create(
          req.body
        ) /* create a new model in the database */
        res.status(201).json({ success: true, data: journey })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    default:
      res.status(400).json({ success: false })
      break
  }
}
