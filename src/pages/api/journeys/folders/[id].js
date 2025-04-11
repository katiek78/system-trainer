import dbConnect from "../../../../lib/dbConnect";
import JourneyFolder from "@/models/JourneyFolder";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case "PUT":
      //Update folder name
      try {
        const updateOperations = [
          {
            updateOne: {
              filter: { _id: id },
              update: { $set: { name: req.body.name } },
            },
          },
        ];
        const updatedJourneyFolder = await JourneyFolder.bulkWrite(
          updateOperations
        );
        if (!updatedJourneyFolder) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: updatedJourneyFolder });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "DELETE" /* Delete a model by its ID */:
      try {
        const deletedJourneyFolder = await JourneyFolder.deleteOne({ _id: id });
        if (!deletedJourneyFolder) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
