import dbConnect from "../../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case "PUT" /* Update only the images where we have an image with matching ID */:
      //     try {
      //THIS DOES NOT WORK PROPERLY - IT IS UPDATING NON-EMPTY ITEMS EVEN ON NO OVERWRITE

      const sourceSetID = req.body.sourceSetID;
      const overwrite = req.body.overwrite;
      console.log(sourceSetID);
      const sourceImageSet = await ImageSet.findOne({ _id: sourceSetID });
      const sourceImages = sourceImageSet.images;
      console.log(sourceImages);

      // const bulkOperations = sourceImages
      //   .filter((sourceImage) => sourceImage.imageItem !== "") // Only non-empty source images
      //   .map((sourceImage) => {
      //     const sourcePhonetics = sourceImage.phonetics;

      //     // Define the update conditions
      //     const updateConditions = {
      //       "images.phonetics": sourcePhonetics,
      //       ...(overwrite ? {} : { "images.imageItem": "" }), // Add condition if no overwrite
      //     };

      //     // Define the update fields
      //     const updateFields = {
      //       $set: {
      //         "images.$[elem].imageItem": sourceImage.imageItem,
      //         "images.$[elem].URL": sourceImage.URL,
      //         "images.$[elem].recentAttempts": sourceImage.recentAttempts,
      //         "images.$[elem].starred": sourceImage.starred,
      //       },
      //     };

      //     return {
      //       updateMany: {
      //         filter: updateConditions,
      //         update: updateFields,
      //         arrayFilters: [{ "elem.phonetics": sourcePhonetics }],
      //       },
      //     };
      //   });

      // // Execute the bulk write
      // if (bulkOperations.length > 0) {
      //   const bulkResult = await ImageSet.bulkWrite(bulkOperations);
      //   console.log("Bulk Update Result:", bulkResult);
      // }

      // // Check if any updates were successful
      // const success = updateResults.some(
      //   (result) => result && result.nModified > 0
      // );

      let updateSuccess = false; // Flag to track if any update was successful

      const updatePromises = sourceImages
        .filter((sourceImage) => sourceImage.imageItem !== "") // Filter out empty source images
        .map(async (sourceImage) => {
          const sourcePhonetics = sourceImage.phonetics;

          const updateConditions = {
            "images.phonetics": sourcePhonetics,
            "images.imageItem": "", // This ensures that target imageItem is empty
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
            updateConditions["images.imageItem"] = "";
          }

          try {
            // Perform the update
            const updateResult = await ImageSet.updateMany(
              updateConditions,
              updateFields,
              { arrayFilters }
            ).exec();

            //        console.log(`Update Result for ${sourcePhonetics}:`, updateResult);

            if (updateResult.matchedCount > 0 && updateResult.nModified > 0) {
              updateSuccess = true;
            }
          } catch (err) {
            console.error(
              `Error updating phonetics for ${sourcePhonetics}:`,
              err
            );
          }
        });

      // Wait for all update operations to complete
      await Promise.all(updatePromises);

      // After all updates, check if any were successful
      if (updateSuccess) {
        console.log("Some images were updated successfully");
      } else {
        console.log("No images were updated");
      }

      res.status(200).json({ updateSuccess });
  }
}
