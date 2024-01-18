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
    //     try {
       //THIS DOES NOT WORK PROPERLY - IT IS UPDATING NON-EMPTY ITEMS EVEN ON NO OVERWRITE
  
        const sourceSetID = req.body.sourceSetID;
        const overwrite = req.body.overwrite;
        console.log(sourceSetID)
        const sourceImageSet = await ImageSet.findOne({ _id: sourceSetID });
        const sourceImages = sourceImageSet.images;
        console.log(sourceImages);

    // const updatePromises = sourceImages.map(async (sourceImage) => {
    //   const sourcePhonetics = sourceImage.phonetics;
      // if (overwrite && sourceImage.imageItem !== '') {
    
      //   const updateResult = await ImageSet.updateMany(
      //     {          
      //     },
         
      //     {
      //       $set: {
      //         "images.$[elem].imageItem": sourceImage.imageItem,
      //         "images.$[elem].URL": sourceImage.URL,
      //         "images.$[elem].recentAttempts": sourceImage.recentAttempts,
      //         "images.$[elem].starred": sourceImage.starred,
      //       },
      //     },
      //     { arrayFilters: [{ "elem.phonetics": sourcePhonetics }] }
      //   ).exec();

      //   console.log(`Update Result for ${sourcePhonetics}:`, updateResult);
      // }

      // if (!overwrite && sourceImage.imageItem !== '') {
    
      //   const updateResult = await ImageSet.updateMany(
      //     {
      //       $or: [
      //         { "images.$[elem].imageItem": { $exists: false } }, // Update if imageItem does not exist
      //         { "images.$[elem].imageItem": null }, // Update if imageItem is null (if you allow null values)
      //         { "images.$[elem].imageItem": '' },
      //       ],

      //     },
         
      //     {
      //       $set: {
      //         "images.$[elem].imageItem": sourceImage.imageItem,
      //         "images.$[elem].URL": sourceImage.URL,
      //         "images.$[elem].recentAttempts": sourceImage.recentAttempts,
      //         "images.$[elem].starred": sourceImage.starred,
      //       },
      //     },
      //     { arrayFilters: [{ "elem.phonetics": sourcePhonetics }] }
      //   ).exec();

      //   console.log(`Update Result for ${sourcePhonetics}:`, updateResult);
      // }

      //   })
    
      const updatePromises = sourceImages
      .filter(sourceImage => sourceImage.imageItem !== '') // Filter out empty source images
      .map(async (sourceImage) => {
        const sourcePhonetics = sourceImage.phonetics;
    
        const updateConditions = {
          "images.phonetics": sourcePhonetics,
          "images.imageItem": '', // This ensures that target imageItem is empty
        };
    
        const updateFields = {
          $set: {
            "images.$[elem].imageItem": sourceImage.imageItem,
            "images.$[elem].URL": sourceImage.URL,
            "images.$[elem].recentAttempts": sourceImage.recentAttempts,
            "images.$[elem].starred": sourceImage.starred,
          },
        };
    
        const arrayFilters = [{ "elem.phonetics": sourcePhonetics }];
    
        if (overwrite) {
          // If overwrite is true, we don't need to check target imageItem
          delete updateConditions["images.imageItem"];
        } else {
          // If overwrite is false, additional condition to update only if target imageItem is empty
          updateConditions["images.imageItem"] = '';
        }
    
        const updateResult = await ImageSet.updateMany(
          updateConditions,
          updateFields,
          { arrayFilters }
        ).exec();
    
        console.log(`Update Result for ${sourcePhonetics}:`, updateResult);
      });
    
    // Execute all update operations concurrently
    const updateResults = await Promise.all(updatePromises);
    
    // Check if any updates were successful
    const success = updateResults.some(result => result && result.nModified > 0);
    
    res.status(200).json({ success });
    
     
  }
}