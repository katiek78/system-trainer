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
      //THIS DOES NOT WORK PROPERLY - IT IS UPDATING EVEN ON NO OVERWRITE

      const sourceSetID = req.body.sourceSetID;
      const overwrite = req.body.overwrite;
      console.log(overwrite);
      const sourceImageSet = await ImageSet.findOne({ _id: sourceSetID });
      const sourceImages = sourceImageSet.images;

      let updateSuccess = false; // Flag to track if any update was successful

      const updatePromises = sourceImages
        .filter((sourceImage) => sourceImage.imageItem !== "") // Filter out empty source images
        .map(async (sourceImage) => {
          if (sourceSetID === id) {
            return res
              .status(400)
              .json({ error: "Source and target sets are the same." });
          }

          const sourcePhonetics = sourceImage.phonetics;

          const updateConditions = {
            _id: id, // This ensures we ONLY update the target set
            "images.phonetics": sourcePhonetics,
          };

          const updateFields = {
            $set: {
              "images.$[elem].imageItem": sourceImage.imageItem,
              "images.$[elem].URL": sourceImage.URL,
              "images.$[elem].recentAttempts": sourceImage.recentAttempts,
              "images.$[elem].starred": sourceImage.starred,
            },
          };

          const arrayFilters = overwrite
            ? [{ "elem.phonetics": sourcePhonetics }]
            : [
                {
                  "elem.phonetics": sourcePhonetics,
                  "elem.imageItem": "",
                  "elem.URL": "",
                },
              ];

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
