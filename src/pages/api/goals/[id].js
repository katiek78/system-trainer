import dbConnect from "../../../lib/dbConnect";
import Goal from "@/models/Goal";
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const session = await auth0.getSession(req, res);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = session.user.sub;

  await dbConnect();

  switch (method) {
    case "GET" /* Get a model by its ID */:
      try {
        const goal = await Goal.findById(id);
        if (!goal) {
          return res
            .status(404)
            .json({ success: false, message: "Goal not found" });
        }
        // Verify ownership
        if (goal.userId !== userId) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }
        res.status(200).json({ success: true, data: goal });
      } catch (error) {
        console.error("Error fetching goal:", error);
        res.status(500).json({ success: false, message: error.message });
      }
      break;

    case "PUT" /* Edit a model by an entry ID */:
      try {
        // First check ownership
        const existingGoal = await Goal.findById(id);
        if (!existingGoal) {
          return res.status(404).json({ success: false });
        }
        if (existingGoal.userId !== userId) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const goal = await Goal.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              startDate: req.body.startDate,
              endDate: req.body.endDate,
              discipline: req.body.discipline,
              score: req.body.score,
              time: req.body.time,
              achieved: req.body.achieved,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        if (!goal) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: goal });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "DELETE" /* Delete a model by its ID */:
      try {
        // First check ownership
        const existingGoal = await Goal.findById(id);
        if (!existingGoal) {
          return res.status(404).json({ success: false });
        }
        if (existingGoal.userId !== userId) {
          return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const deletedGoal = await Goal.deleteOne({ _id: id });
        if (!deletedGoal) {
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
