import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  await dbConnect();

  const session = await auth0.getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const userId = session.user.sub;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing image set id" });
  }

  try {
    // Find the image set and check permissions
    const imageSet = await ImageSet.findOne(
      {
        _id: id,
        $or: [
          { userId: userId }, // User owns it
          { userId: null }, // Public set
          { userId: { $exists: false } }, // Public set (no userId field)
        ],
      },
      { name: 1, setType: 1, images: { name: 1, phonetics: 1 }, userId: 1 }
    );

    if (!imageSet) {
      return res.status(404).json({ error: "Image set not found" });
    }

    // Serialize the response
    const result = {
      name: imageSet.name,
      setType: imageSet.setType,
      userId: imageSet.userId || null,
      images: imageSet.images || [],
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in getName:", err);
    res.status(500).json({ error: "Server error" });
  }
}
