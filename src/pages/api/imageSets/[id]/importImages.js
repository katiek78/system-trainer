import dbConnect from '../../../../lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
   

    case 'PUT'  /* Update only the images where we have an image with matching ID */:
        try {
       
            const updateOperations = req.body.images.map(image => ({
                updateOne: {
                filter: { _id: id, "images._id": image._id },
                update: { $set: { "images.$.imageItem": image.imageItem, "images.$.recentAttempts":image.recentAttempts, "images.$.starred":image.starred }}
                //update: { $set: { "images.$": image }}
                }
            }))
            ;   
        console.log(JSON.stringify(updateOperations[0]))
            const changes = await ImageSet.bulkWrite  (updateOperations);
    
        // for (const image of req.body.images) {
        //     const filter = { _id: id, "images._id": image._id };
        //     const update = { $set: { "images.$.imageItem": image.imageItem } };
      
        //     const result = await ImageSet.updateOne(filter, update);
        //     console.log("Updated:", result.modifiedCount);
        //   }
    
        //   if (!changes) {
        //     return res.status(400).json({ success: false })
        //   }
          res.status(200).json({ success: true })
        } catch (error) {
            console.log(error)
          res.status(400).json({ success: false })
        }
        break
  
      default:
        res.status(400).json({ success: false })
        break
    }
  }