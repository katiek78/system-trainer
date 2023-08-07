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
       
        //     const updateOperations = req.body.images.map(image => ({
        //         updateOne: {
        //         filter: { _id: id, "images._id": image._id },
        //         update: { $set: { "images.$.imageItem": image.imageItem, "images.$.recentAttempts":image.recentAttempts, "images.$.starred":image.starred }}
        //         //update: { $set: { "images.$": image }}
        //         }
        //     }))
        //     ;   
        // console.log(JSON.stringify(updateOperations[0]))
        //     const changes = await ImageSet.bulkWrite  (updateOperations);
    
        const sourceSetID = req.body.sourceSetID;
        const overwrite = req.body.overwrite;
        console.log(sourceSetID)
        const sourceImageSet = await ImageSet.findOne({ _id: sourceSetID });
        const sourceImages = sourceImageSet.images;
    
        // // Iterate through the source images and update matching images in the current ImageSet
        // for (const sourceImage of sourceImages) {
        //   const sourcePhonetics = sourceImage.phonetics;
    
        //   await ImageSet.updateMany(
        //     { _id: id, "images.phonetics": sourcePhonetics },
        //     { $set: { "images.$[image].imageItem": sourceImage.imageItem, "images.$[image].URL": sourceImage.URL, "images.$[image].recentAttempts": sourceImage.recentAttempts, "images.$[image].starred": sourceImage.starred } },
        //     { arrayFilters: [{ "image.phonetics": sourcePhonetics }] }
        //   );
        // }
        

        // Create an array of update operations
        const updatePromises = sourceImages.map(async (sourceImage) => {
          const sourcePhonetics = sourceImage.phonetics;

          if (overwrite || !sourceImage.imageItem) {
            return ImageSet.updateMany(
              { _id: id, "images.phonetics": sourcePhonetics },
              {
                $set: {
                  "images.$[image].imageItem": sourceImage.imageItem,
                  "images.$[image].URL": sourceImage.URL,
                  "images.$[image].recentAttempts": sourceImage.recentAttempts,
                  "images.$[image].starred": sourceImage.starred,
                },
              },
              { arrayFilters: [{ "image.phonetics": sourcePhonetics }] }
            );
          }
        });

        // Execute all update operations concurrently
        await Promise.all(updatePromises);

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