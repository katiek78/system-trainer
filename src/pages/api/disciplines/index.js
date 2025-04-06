import dbConnect from "../../../lib/dbConnect";
import { getSession } from "@auth0/nextjs-auth0";
import JourneyAssignment from "@/models/JourneyAssignment";

export default async function handler(req, res) {
  const {
    query: { discipline },
    method,
  } = req;

  const session = await getSession(req, res);
  console.log("SESSION:", session);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const userId = session.user.sub;

  console.log("Discipline:", discipline);
  console.log("User ID:", userId);

  await dbConnect();

  switch (method) {
    case "GET" /* Get a journey assignment by discipline ID and user ID */:
      try {
        const assignment = await JourneyAssignment.findOne({
          discipline,
          userId,
        });
        if (!assignment) {
          return res.status(200).json({ success: true, data: null });
        }
        return res.status(200).json({ success: true, data: assignment });
      } catch (error) {
        return res.status(400).json({ success: false });
      }
      break;

    case "POST" /* Add a new assignment for this user and discipline if it doesn't already exist */:
      try {
        const { journeyId } = req.body;

        if (!discipline || !journeyId) {
          return res
            .status(400)
            .json({ success: false, error: "Missing required fields" });
        }

        const newAssignment = await JourneyAssignment.create({
          discipline,
          userId,
          journeySets: [
            { journeyIDs: journeyId }, // Single journeySet with one journeyID
          ],
        });

        await newAssignment.save();

        return res.status(201).json({ success: true, data: newAssignment });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "PUT" /* Edit the entire journey assignment for a user and discipline */:
      try {
        const updatedAssignment = req.body; // The whole updated assignment object

        if (
          !updatedAssignment ||
          !updatedAssignment.journeySets ||
          !discipline
        ) {
          return res
            .status(400)
            .json({ success: false, error: "Missing required fields" });
        }

        // Find the existing assignment
        const existingAssignment = await JourneyAssignment.findOne({
          discipline,
          userId,
        });

        if (!existingAssignment) {
          return res
            .status(404)
            .json({ success: false, error: "Assignment not found" });
        }

        // Make sure the incoming data matches the expected structure and update
        existingAssignment.journeySets = updatedAssignment.journeySets;

        // Save the updated assignment
        await existingAssignment.save();

        return res
          .status(200)
          .json({ success: true, data: existingAssignment });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      return res.status(400).json({ success: false });
      break;
    //   }
    // default:
    //   // Handle unsupported methods
    //   res.setHeader("Allow", ["GET"]);
    //   return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
