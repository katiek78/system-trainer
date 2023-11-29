import dbConnect from '../../../lib/dbConnect'
import LogEntry from '@/models/LogEntry'

export default async function handler(req, res) {
  const { method } = req

  await dbConnect()

  switch (method) {
    case 'GET':
      try {
        const logEntries = await LogEntry.find({}) /* find all the data in our database */
        res.status(200).json({ success: true, data: logEntries })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    case 'POST':
      console.log(req.body)
      try {
        const logEntry = await LogEntry.create(
          req.body
        ) /* create a new model in the database */
        res.status(201).json({ success: true, data: logEntry })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break
    default:
      res.status(400).json({ success: false })
      break
  }
}
