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
          ImageSet.findOne({ _id: sourceSetID })
            .select({ "images.phonetics": 1, "images.imageItem": 1 })
            .lean()
            .exec(),
          ImageSet.findOne({ _id: id }).lean().exec(),
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
            sourceMap[img.phonetics] = img.imageItem;
          }
        }

        // Batching: determine which images to process in this batch
        const totalImages = targetSet.images.length;
        const batchStart = Math.max(
          0,
          Math.min(batchIndex * batchSize, totalImages)
        );
        const batchEnd = Math.max(
          batchStart,
          Math.min(batchStart + batchSize, totalImages)
        );
        const batchIndexes = [];
        console.log("Batch info:", {
          batchIndex,
          batchSize,
          batchStart,
          batchEnd,
          totalImages,
        });
        for (let i = batchStart; i < batchEnd; i++) {
          batchIndexes.push(i);
        }

        // Merge images for this batch only
        const newImages = targetSet.images.map((targetImg, idx) => {
          try {
            if (!batchIndexes.includes(idx)) return targetImg;
            const srcImageItem = sourceMap[targetImg.phonetics];
            if (srcImageItem === undefined) return targetImg;
            let updated = false;
            let newImage = { ...targetImg };
            if (overwrite) {
              newImage.imageItem = srcImageItem;
              updated = true;
            } else {
              if (
                targetImg.imageItem === undefined ||
                targetImg.imageItem === null ||
                targetImg.imageItem === ""
              ) {
                newImage.imageItem = srcImageItem;
                updated = true;
              }
            }
            if (updated) updatedCount++;
            return newImage;
          } catch (err) {
            console.error("Error processing image at idx", idx, err);
            return targetImg;
          }
        });

        // Update in one DB call

        // Use native MongoDB driver to force update
        const updateResult = await ImageSet.collection.updateOne(
          { _id: targetSet._id },
          { $set: { images: newImages } }
        );
        console.log("Native update result:", updateResult);

        const moreBatches = batchEnd < targetSet.images.length;
        return res.status(200).json({
          updatedCount,
          moreBatches,
          nextBatchIndex: moreBatches ? batchIndex + 1 : null,
          updateResult,
        });
      } catch (err) {
        console.error("PUT handler error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
