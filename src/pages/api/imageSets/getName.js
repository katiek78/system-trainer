import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing image set id" });
  }
  try {
    const imageSet = await ImageSet.findById(id, { name: 1, setType: 1 });
    if (!imageSet) {
      return res.status(404).json({ error: "Image set not found" });
    }
    res.status(200).json({ name: imageSet.name, setType: imageSet.setType });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
