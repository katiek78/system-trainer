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
          if (overwrite || (!targetImg.imageItem && !targetImg.URL)) {
            updatedCount++;
            return {
              ...targetImg,
              imageItem: src.imageItem,
              URL: src.URL,
              recentAttempts: src.recentAttempts,
              starred: src.starred,
            };
          }
          return targetImg;
        });

        // Update in one DB call
        await ImageSet.updateOne({ _id: id }, { $set: { images: newImages } });

        const moreBatches = batchEnd < targetSet.images.length;
        return res.status(200).json({
          updatedCount,
          moreBatches,
          nextBatchIndex: moreBatches ? batchIndex + 1 : null,
        });
      } catch (err) {
        console.error("PUT handler error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
