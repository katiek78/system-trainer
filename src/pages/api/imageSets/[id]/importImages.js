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
        const id = req.query.id;
        const batchSize = req.body.batchSize || 200; // default batch size
        const batchIndex = req.body.batchIndex || 0; // default to first batch

        // Validate required inputs
        if (!sourceSetID || !id) {
          return res
            .status(400)
            .json({ error: "Missing sourceSetID or target ID." });
        }
        if (sourceSetID === id) {
          return res
            .status(400)
            .json({ error: "Source and target sets are the same." });
        }

        // Fetch both sets
        const [sourceSet, targetSet] = await Promise.all([
          ImageSet.findOne({ _id: sourceSetID }).exec(),
          ImageSet.findOne({ _id: id }).exec(),
        ]);
        if (!sourceSet) {
          return res.status(404).json({ error: "Source image set not found." });
        }
        if (!targetSet) {
          return res.status(404).json({ error: "Target image set not found." });
        }

        const sourceImages = sourceSet.images || [];
        if (sourceImages.length === 0) {
          return res
            .status(400)
            .json({ error: "Source image set has no images." });
        }
        let updatedCount = 0;

        // Build a map for quick lookup
        const sourceMap = {};
        for (const img of sourceImages) {
          if (img.phonetics && img.imageItem !== "") {
            sourceMap[img.phonetics] = img;
          }
        }

        // Batching: determine which images to process in this batch
        const allTargetIndexes = targetSet.images.map((img, idx) => idx);
        const batchStart = batchIndex * batchSize;
        const batchEnd = batchStart + batchSize;
        const batchIndexes = allTargetIndexes.slice(batchStart, batchEnd);

        // Merge images for this batch only
        const newImages = targetSet.images.map((targetImg, idx) => {
          if (!batchIndexes.includes(idx)) return targetImg;
          const src = sourceMap[targetImg.phonetics];
          if (!src) return targetImg;
          let updated = false;
          let itemUpdated = false;
          let urlUpdated = false;
          let newImage = { ...targetImg };
          if (overwrite) {
            newImage.imageItem = src.imageItem;
            newImage.URL = src.URL;
            newImage.recentAttempts = src.recentAttempts;
            newImage.starred = src.starred;
            updated = true;
          } else {
            // Treat empty string as missing, update fields independently
            if (
              (targetImg.imageItem === undefined ||
                targetImg.imageItem === null ||
                targetImg.imageItem === "") &&
              src.imageItem !== undefined
            ) {
              newImage.imageItem = src.imageItem;
              itemUpdated = true;
            }
            if (
              (targetImg.URL === undefined ||
                targetImg.URL === null ||
                targetImg.URL === "") &&
              src.URL !== undefined
            ) {
              newImage.URL = src.URL;
              urlUpdated = true;
            }
            if (itemUpdated || urlUpdated) {
              newImage.recentAttempts = src.recentAttempts;
              newImage.starred = src.starred;
              updated = true;
              // Debug log
              console.log(`Updated image at idx ${idx}:`, {
                itemUpdated,
                urlUpdated,
                newImage,
              });
            }
          }
          if (updated) updatedCount++;
          return newImage;
        });

        // Update in one DB call
        const updateResult = await ImageSet.updateOne(
          { _id: id },
          { $set: { images: newImages } }
        );
        console.log("Update result:", updateResult);

        // Fetch the updated document to verify
        const verifySet = await ImageSet.findOne({ _id: id }).lean();
        console.log(
          "First 3 images after update:",
          verifySet.images.slice(0, 3)
        );

        const moreBatches = batchEnd < targetSet.images.length;
        return res.status(200).json({
          updatedCount,
          moreBatches,
          nextBatchIndex: moreBatches ? batchIndex + 1 : null,
          updateResult,
          verifyImages: verifySet.images.slice(0, 3),
        });
      } catch (err) {
        console.error("PUT handler error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
