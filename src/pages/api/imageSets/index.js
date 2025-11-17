import dbConnect from "../../../lib/dbConnect";
import ImageSet from "@/models/ImageSet";

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const imageSets = await ImageSet.find(
          {}
        ); /* find all the data in our database */
        res.status(200).json({ success: true, data: imageSets });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      console.log(req.body);
      // Enforce setType presence
      if (
        !req.body.setType ||
        typeof req.body.setType !== "string" ||
        req.body.setType.trim() === ""
      ) {
        res.status(400).json({
          success: false,
          message: "setType is required and must be a non-empty string.",
        });
        return;
      }
      try {
        const imageSet = await ImageSet.create({
          ...req.body,
          setType: req.body.setType.trim(),
        });
        res
          .status(201)
          .json({ success: true, message: "created successfully" });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}
