import dbConnect from '../../../lib/dbConnect'
import PlanEntry from '@/models/PlanEntry'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
    case 'GET' /* Get a model by its ID */:
      try {
        const planEntry = await PlanEntry.findById(id)
        if (!planEntry) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: planEntry })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

      case 'PUT' /* Edit a model by an entry ID */:
        try {      
          const planEntry = await PlanEntry.findOneAndUpdate(
            { _id: id },
            { $set: { 
              discipline: req.body.discipline,
              frequency: req.body.frequency,
              frequencyType: req.body.frequencyType,
              frequencySpecifics: req.body.frequencySpecifics,           
            }
        }, {
            new: true,
            runValidators: true,
          })        
          if (!planEntry) {
            return res.status(400).json({ success: false })
          }
          res.status(200).json({ success: true, data: planEntry })
        } catch (error) {
          res.status(400).json({ success: false })
        }
        break



    case 'DELETE' /* Delete a model by its ID */:
      try {
        const deletedPlanEntry = await PlanEntry.deleteOne({ _id: id })
        if (!deletedPlanEntry) {
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
