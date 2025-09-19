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
      try {
        const sourceSetID = req.body.sourceSetID;
        const overwrite = req.body.overwrite;
        const id = req.query.id; // Make sure you're getting the target set ID

        // Validate required inputs
        if (!sourceSetID || !id) {
          return res
            .status(400)
            .json({ error: "Missing sourceSetID or target ID." });
        }

        // Prevent updating the same set
        if (sourceSetID === id) {
          return res
            .status(400)
            .json({ error: "Source and target sets are the same." });
        }

        // Fetch the source image set
        const sourceSet = await ImageSet.findOne({ _id: sourceSetID }).exec();
        if (!sourceSet) {
          return res.status(404).json({ error: "Source image set not found." });
        }

        const sourceImages = sourceSet.images || [];
        if (sourceImages.length === 0) {
          return res
            .status(400)
            .json({ error: "Source image set has no images." });
        }

        let updateSuccess = false;

        // Map all updates safely
        const updatePromises = sourceImages
          .filter((img) => img.imageItem !== "")
          .map(async (sourceImage) => {
            const sourcePhonetics = sourceImage.phonetics;
            if (!sourcePhonetics) return; // Skip if phonetics missing

            const updateConditions = {
              _id: id,
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
                    "elem.imageItem": { $in: [null, ""] },
                    "elem.URL": { $in: [null, ""] },
                  },
                ];

            try {
              const result = await ImageSet.updateMany(
                updateConditions,
                updateFields,
                { arrayFilters }
              ).exec();

              if (result.matchedCount > 0 && result.modifiedCount > 0) {
                updateSuccess = true;
              }
            } catch (err) {
              console.error(
                `Error updating phonetics for ${sourcePhonetics}:`,
                err
              );
            }
          });

        // Wait for all updates, but don’t let a rejection break the handler
        await Promise.all(updatePromises);

        console.log(
          updateSuccess
            ? "Some images were updated successfully"
            : "No images were updated"
        );

        return res.status(200).json({ updateSuccess });
      } catch (err) {
        console.error("PUT handler error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
