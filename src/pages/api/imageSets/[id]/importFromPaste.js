import dbConnect from "../../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case "PUT": {
      const { overwrite, newImages } = req.body;
      console.log(overwrite);
      console.log(newImages);
      let updateSuccess = false;

      const updatePromises = newImages
        .filter(([name, item]) => name && item)
        .map(async ([imageName, imageItem]) => {
          try {
            let updateResult;

            if (overwrite) {
              updateResult = await ImageSet.updateMany(
                { _id: id, "images.name": imageName },
                { $set: { "images.$.imageItem": imageItem } }
              );
            } else {
              updateResult = await ImageSet.updateMany(
                { _id: id },
                {
                  $set: {
                    "images.$[elem].imageItem": imageItem,
                  },
                },
                {
                  arrayFilters: [
                    {
                      "elem.name": imageName,
                      "elem.imageItem": { $in: [null, ""] },
                      "elem.URL": { $in: [null, ""] },
                    },
                  ],
                }
              );
            }

            if (
              updateResult.matchedCount > 0 &&
              updateResult.modifiedCount > 0
            ) {
              updateSuccess = true;
            }
          } catch (err) {
            console.error(`Error updating "${imageName}":`, err);
          }
        });

      await Promise.all(updatePromises);

      if (updateSuccess) {
        console.log("Some images were updated successfully");
      } else {
        console.log("No images were updated");
      }

      res.status(200).json({ updateSuccess });
      break;
    }

    case "PUT2" /* Update only the images that appear in the list */:
      //const overwrite = req.body.overwrite;
      //get image set from body
      const newImages = req.body;
      let updateSuccess = false; // Flag to track if any update was successful

      const updatePromises = newImages
        .filter((newImage) => newImage[0] !== "" && newImage[1] !== "") // Filter out empty source images
        .map(async (newImage) => {
          const updateConditions = {
            _id: id, // This ensures we ONLY update the target set
            "images.name": newImage[0],
          };

          const updateFields = {
            $set: {
              "images.$[elem].imageItem": newImage[1],
            },
          };

          const arrayFilters = overwrite
            ? [{ "elem.phonetics": sourcePhonetics }]
            : [
                {
                  "elem.phonetics": sourcePhonetics,
                  "elem.imageItem": { $in: [null, ""] },
                  "elem.URL": { $in: [null, ""] },
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
            console.error(`Error importing pasted images:`, err);
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
