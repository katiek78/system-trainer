import dbConnect from '../../../lib/dbConnect'
import LogEntry from '@/models/LogEntry'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
    case 'GET' /* Get a model by its ID */:
      try {
        const logEntry = await LogEntry.findById(id)
        if (!logEntry) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: logEntry })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

      case 'PUT' /* Edit a model by an entry ID */:
        try {      
          const logEntry = await LogEntry.findOneAndUpdate(
            { _id: id },
            { $set: { 
              date: req.body.date,
              discipline: req.body.discipline,
              journey: req.body.journey,
              score: req.body.score,
              correct: req.body.correct,
              time: req.body.time,
              notes: req.body.notes
            }
        }, {
            new: true,
            runValidators: true,
          })        
          if (!logEntry) {
            return res.status(400).json({ success: false })
          }
          res.status(200).json({ success: true, data: logEntry })
        } catch (error) {
          res.status(400).json({ success: false })
        }
        break

    // case 'PUT' /* Edit a model by its ID */:        
    //     console.log(req.body)
    //   try {
    //     // const imageSet = await ImageSet.findByIdAndUpdate(id, req.body, {
    //     //   new: true,
    //     //   runValidators: true,
    //     // })

    //     const updateOperation = {
    //       updateOne: {
    //         filter: { _id: id, "images._id": req.body._id },
    //         update: { $set: { "images.$": req.body } }
    //       }
    //     };

    //     const changes = await ImageSet.bulkWrite([updateOperation])

    //     if (!changes) {
    //       return res.status(400).json({ success: false })
    //     }
    //     res.status(200).json({ success: true, data: changes })
    //   } catch (error) {
    //     res.status(400).json({ success: false })
    //   }
    //   break

    case 'DELETE' /* Delete a model by its ID */:
      try {
        const deletedLogEntry = await LogEntry.deleteOne({ _id: id })
        if (!deletedLogEntry) {
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
