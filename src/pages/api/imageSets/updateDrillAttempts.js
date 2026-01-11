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
  const { imageSetId, drillAttempts } = req.body;

  if (!imageSetId || !drillAttempts || !Array.isArray(drillAttempts)) {
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

    // Helper function to extract key from item (same logic as in drills page)
    const getItemKey = (item) => {
      if (typeof item === "string") return item;
      if (item.type === "cards") {
        return item.cards.map((c) => `${c.value}${c.suit}`).join("");
      }
      return item.key || item.display || JSON.stringify(item);
    };

    // Group attempts by image name/key
    const attemptsByImage = {};
    drillAttempts.forEach(({ item, known }) => {
      const key = getItemKey(item);
      if (!attemptsByImage[key]) {
        attemptsByImage[key] = [];
      }
      attemptsByImage[key].push(known ? 1 : 0);
    });

    // Helper function to normalize emoji variation selectors
    // Removes variation selector (U+FE0F) from strings for comparison
    const normalizeEmoji = (str) => {
      return str ? str.replace(/\uFE0F/g, "") : str;
    };

    // Update each image's recentAttempts
    imageSet.images.forEach((image) => {
      // Try exact match first
      let attempts =
        attemptsByImage[image.name] || attemptsByImage[image.imageItem];

      // If no exact match, try matching without emoji variation selectors
      if (!attempts) {
        const normalizedImageName = normalizeEmoji(image.name);
        const normalizedImageItem = normalizeEmoji(image.imageItem);

        // Find matching attempt key by comparing normalized versions
        for (const [key, attemptArray] of Object.entries(attemptsByImage)) {
          const normalizedKey = normalizeEmoji(key);
          if (
            normalizedKey === normalizedImageName ||
            normalizedKey === normalizedImageItem
          ) {
            attempts = attemptArray;
            break;
          }
        }
      }

      if (attempts && attempts.length > 0) {
        // Initialize recentAttempts if it doesn't exist
        if (!image.recentAttempts) {
          image.recentAttempts = [];
        }

        // Add all new attempts, maintaining max length of 7
        attempts.forEach((attempt) => {
          if (image.recentAttempts.length === 7) {
            image.recentAttempts.shift();
          }
          image.recentAttempts.push(attempt);
        });
      }
    });

    await imageSet.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to update drill attempts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
