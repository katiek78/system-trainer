import dbConnect from '../../../lib/dbConnect'
import System from '@/models/System'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        const system = await System.findById(id)
        if (!system) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: system })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'PUT' /* Edit a model by its ID */:
      try {
        const system = await System.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        })
        if (!system) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: system })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    case 'DELETE' /* Delete a model by its ID */:
      try {
        const deletedSystem = await System.deleteOne({ _id: id })
        if (!deletedSystem) {
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
