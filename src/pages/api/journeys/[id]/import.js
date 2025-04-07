import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case "POST" /* Add multiple points by journey ID */:
      try {
        // const newPoints = JSON.parse(req.body)
        const newPoints = req.body;
        console.log(newPoints);
        const updatedJourney = await Journey.findByIdAndUpdate(
          id,
          { $addToSet: { points: { $each: newPoints } } },
          { new: true }
        ); // Add multiple points to the journey

        res.status(201).json({ success: true, data: updatedJourney });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
