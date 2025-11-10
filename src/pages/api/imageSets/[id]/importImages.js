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

        // Merge images
        const newImages = targetSet.images.map((targetImg) => {
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

        return res.status(200).json({ updatedCount });
      } catch (err) {
        console.error("PUT handler error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}
