import dbConnect from '../../../lib/dbConnect'
import Journey from '@/models/Journey'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
    case 'GET' /* Get a model by its ID */:
      try {
        const journey = await Journey.findById(id)
        if (!journey) {
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: journey })
      } catch (error) {
        res.status(400).json({ success: false })
      }
      break

    // case 'PUT' /* Edit a model by its ID */:
    //     console.log("updating one journey")
    //     console.log(req.body)
    //   try {
       
    //     const updateOperation = {
    //       updateOne: {
    //         filter: { _id: id, "points._id": req.body._id },
    //         update: { $set: { "points.$": req.body } }
    //       }
    //     };

    //     const changes = await Journey.bulkWrite([updateOperation])

    //     if (!changes) {
    //       return res.status(400).json({ success: false })
    //     }
    //     res.status(200).json({ success: true, data: changes })
    //   } catch (error) {
    //     res.status(400).json({ success: false })
    //   }
    //   break

    case 'PUT':       
        try {
          const updateOperations = [ 
            {
            updateOne: {
              filter: { _id: id },
              update: { $set: { name: req.body.name } }
            }
          }, ...req.body.points.map(point => ({
            updateOne: {
              filter: { _id: id, "points._id": point._id },
              update: { $set: { "points.$": point } }
            }
          }))
        ];
 
          const changes = await Journey.bulkWrite(updateOperations);
  
  
          if (!changes) {
            return res.status(400).json({ success: false })
          }
          res.status(200).json({ success: true, data: changes })
        } catch (error) {
  
          res.status(400).json({ success: false })
        }
        break


    case 'DELETE' /* Delete a model by its ID */:
      try {
        const deletedJourney = await Journey.deleteOne({ _id: id })
        if (!deletedJourney) {
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
