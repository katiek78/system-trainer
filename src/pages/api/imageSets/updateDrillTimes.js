import dbConnect from "../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const session = await auth0.getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = session.user.sub;
  const { imageSetId, drillTimings } = req.body;

  if (!imageSetId || !drillTimings || !Array.isArray(drillTimings)) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  await dbConnect();

  try {
    const imageSet = await ImageSet.findOne({ _id: imageSetId, userId });

    if (!imageSet) {
      return res
        .status(404)
        .json({ success: false, message: "Image set not found" });
    }

    // Group timings by image name/key
    const timingsByImage = {};
    drillTimings.forEach(({ item, ms }) => {
      const key =
        typeof item === "string" ? item : item.key || JSON.stringify(item);
      if (!timingsByImage[key]) {
        timingsByImage[key] = [];
      }
      timingsByImage[key].push(ms / 1000); // Convert to seconds
    });

    // Helper function to normalize emoji variation selectors
    // Removes variation selector (U+FE0F) from strings for comparison
    const normalizeEmoji = (str) => {
      return str ? str.replace(/\uFE0F/g, "") : str;
    };

    // Update each image
    const now = new Date();
    imageSet.images.forEach((image) => {
      // Try exact match first
      let timings =
        timingsByImage[image.name] || timingsByImage[image.imageItem];

      // If no exact match, try matching without emoji variation selectors
      if (!timings) {
        const normalizedImageName = normalizeEmoji(image.name);
        const normalizedImageItem = normalizeEmoji(image.imageItem);

        // Find matching timing key by comparing normalized versions
        for (const [key, times] of Object.entries(timingsByImage)) {
          const normalizedKey = normalizeEmoji(key);
          if (
            normalizedKey === normalizedImageName ||
            normalizedKey === normalizedImageItem
          ) {
            timings = times;
            break;
          }
        }
      }

      if (timings && timings.length > 0) {
        const totalNewDrills = timings.length;
        const sumNewTimes = timings.reduce((a, b) => a + b, 0);

        // Update average: (old_avg * old_count + new_sum) / (old_count + new_count)
        const oldTotal = image.averageDrillTime * image.totalDrills;
        image.totalDrills += totalNewDrills;
        image.averageDrillTime = (oldTotal + sumNewTimes) / image.totalDrills;
        image.lastDrilledAt = now;
      }
    });

    await imageSet.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating drill times:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
