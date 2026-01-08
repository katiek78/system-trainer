import dbConnect from "../../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import DrillAttempt from "@/models/DrillAttempt";
import { getConfidenceLevel } from "@/utilities/confidenceLevel";

export default async function handler(req, res) {
  const {
    query: {
      id,
      page = "1",
      limit = "100",
      sortBy = "name",
      sortDesc = "false",
      filter = "",
    },
    method,
  } = req;

  await dbConnect();

  if (method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const isDesc = sortDesc === "true";

    // First get basic info and total count
    const imageSet = await ImageSet.findById(id).select("name images").lean();

    if (!imageSet) {
      return res
        .status(404)
        .json({ success: false, message: "Image set not found" });
    }

    // Apply filter first
    let filteredImages = imageSet.images;
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredImages = imageSet.images.filter((img) => {
        const name = (img.name || img.imageItem || "").toLowerCase();
        return name.startsWith(filterLower);
      });
    }

    const totalImages = filteredImages.length;

    // Helper function to get card sort value
    const getCardSortValue = (name) => {
      if (!name) return "";

      // Card value order
      const cardOrder = {
        A: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        J: 11,
        Q: 12,
        K: 13,
      };

      // Suit order: hearts, diamonds, clubs, spades (with and without variation selectors)
      const suitOrder = {
        "♥": 1,
        "♥️": 1,
        "♦": 2,
        "♦️": 2,
        "♣": 3,
        "♣️": 3,
        "♠": 4,
        "♠️": 4,
      };

      // Extract cards from the name
      // Match patterns like "A♠", "10♥️", "A♠K♥", etc.
      const cardPattern = /(A|[2-9]|10|J|Q|K)(♠️?|♥️?|♦️?|♣️?)/g;
      const matches = [...name.matchAll(cardPattern)];

      if (matches.length === 0) {
        // Not a card format, use original lowercase string
        return name.toLowerCase();
      }

      // Create a sortable string based on card values and suits
      // For card sets: sort by card1 suit, card1 value, card2 suit, card2 value
      let sortValue = "";
      for (const match of matches) {
        const value = match[1];
        const suit = match[2];
        const valueNum = cardOrder[value] || 0;
        const suitNum = suitOrder[suit] || 0;
        // All cards: suit then value
        sortValue += suitNum + valueNum.toString().padStart(2, "0");
      }

      return sortValue;
    };

    // Sort images on server side
    let sortedImages = [...filteredImages];

    sortedImages.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = getCardSortValue(a.name || a.imageItem || "");
          bVal = getCardSortValue(b.name || b.imageItem || "");
          break;
        case "confidence":
          aVal = getConfidenceLevel(a.recentAttempts || []);
          bVal = getConfidenceLevel(b.recentAttempts || []);
          break;
        case "avgTime":
          aVal = a.averageDrillTime || 0;
          bVal = b.averageDrillTime || 0;
          break;
        case "totalDrills":
          aVal = a.totalDrills || 0;
          bVal = b.totalDrills || 0;
          break;
        case "lastDrilled":
          aVal = a.lastDrilledAt ? new Date(a.lastDrilledAt).getTime() : 0;
          bVal = b.lastDrilledAt ? new Date(b.lastDrilledAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      // Primary sort by the selected column
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;

      // Secondary sort by image name (when primary values are equal)
      const aName = getCardSortValue(a.name || a.imageItem || "");
      const bName = getCardSortValue(b.name || b.imageItem || "");
      if (aName < bName) return -1;
      if (aName > bName) return 1;

      return 0;
    });

    const totalPages = Math.ceil(totalImages / limitNum);

    // Paginate after sorting
    const paginatedImages = sortedImages
      .slice(skip, skip + limitNum)
      .map((img) => ({
        _id: img._id.toString(),
        name: img.name,
        imageItem: img.imageItem,
        recentAttempts: img.recentAttempts || [],
        averageDrillTime: img.averageDrillTime || 0,
        totalDrills: img.totalDrills || 0,
        lastDrilledAt: img.lastDrilledAt || null,
      }));

    // Calculate overall stats from all images
    const totalDrilled = sortedImages.filter(
      (img) => img.totalDrills > 0
    ).length;

    // Only include items that have actually been drilled in average calculation
    const drilledImages = sortedImages.filter(
      (img) => img.totalDrills > 0 && img.averageDrillTime > 0
    );
    const avgTimeOverall =
      drilledImages.length > 0
        ? drilledImages.reduce((sum, img) => sum + img.averageDrillTime, 0) /
          drilledImages.length
        : 0;

    // Calculate total attempts from DrillAttempt records
    const drillAttempts = await DrillAttempt.find({
      imageSetId: id,
    }).lean();

    const totalAttempts = drillAttempts.reduce(
      (sum, attempt) => sum + (attempt.itemsAttempted || 0),
      0
    );

    const statsData = {
      _id: imageSet._id.toString(),
      name: imageSet.name,
      images: paginatedImages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalImages,
        pageSize: limitNum,
      },
      overallStats: {
        totalDrilled,
        avgTimeOverall,
        totalAttempts,
      },
    };

    console.log(
      `Stats response: page ${pageNum}/${totalPages}, ${paginatedImages.length} items`
    );
    res.status(200).json({ success: true, data: statsData });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(400).json({ success: false, message: "Failed to fetch stats" });
  }
}
