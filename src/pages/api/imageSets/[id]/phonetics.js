import dbConnect from '../../../../lib/dbConnect'
import ImageSet from '@/models/ImageSet'

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req

  await dbConnect()

  switch (method) {    
    // case 'GET' /* Get a model by its ID */:
    //   try {
    //     const imageSet = await ImageSet.findById(id)
    //     if (!imageSet) {
    //       return res.status(400).json({ success: false })
    //     }
    //     res.status(200).json({ success: true, data: imageSet })
    //   } catch (error) {
    //     res.status(400).json({ success: false })
    //   }
    //   break

    case 'PUT' /* Edit phonetics by image set ID */:
     
      try {
        
       
        const bulkUpdateOperations = [];

        // Loop through each index and add an update operation for each element in the "images" array.
        req.body.forEach((phonetics, index) => {
            const updateOperation = {
                updateOne: {
                  filter: { _id: id },
                  update: {
                    $set: {
                      [`images.${index}.phonetics`]: phonetics,
                    },
                  },
                },
              };
            bulkUpdateOperations.push(updateOperation);
          });

        const changes = await ImageSet.bulkWrite(bulkUpdateOperations)

        if (!changes) {         
          return res.status(400).json({ success: false })
        }
        res.status(200).json({ success: true, data: changes })
      } catch (error) {
        console.error('Error:', error);
        res.status(400).json({ success: false })
      }
      break

//     case 'DELETE' /* Delete a model by its ID */:
//       try {
//         const deletedImageSet = await ImageSet.deleteOne({ _id: id })
//         if (!deletedImageSet) {
//           return res.status(400).json({ success: false })
//         }
//         res.status(200).json({ success: true, data: {} })
//       } catch (error) {
//         res.status(400).json({ success: false })
//       }
//       break

//     default:
//       res.status(400).json({ success: false })
//       break
   }
 }
