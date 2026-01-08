import dbConnect from "../../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { getConfidenceLevel } from "@/utilities/confidenceLevel";

export default async function handler(req, res) {
  const {
    query: {
      id,
      page = "1",
      limit = "100",
      sortBy = "name",
      sortDesc = "false",
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

    const totalImages = imageSet.images.length;

    // Sort images on server side
    let sortedImages = [...imageSet.images];

    sortedImages.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = (a.name || a.imageItem || "").toLowerCase();
          bVal = (b.name || b.imageItem || "").toLowerCase();
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

      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
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
    const avgTimeOverall =
      sortedImages.length > 0
        ? sortedImages.reduce(
            (sum, img) => sum + (img.averageDrillTime || 0),
            0
          ) / sortedImages.length
        : 0;
    const totalAttempts = sortedImages.reduce(
      (sum, img) => sum + (img.totalDrills || 0),
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
