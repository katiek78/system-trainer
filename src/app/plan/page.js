import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import PlanEntry from "@/models/PlanEntry";
import PlanInteractive from "./PlanInteractive";

export default async function PlanPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="p-8 text-center">
        You must be logged in to view this page.
      </div>
    );
  }

  await dbConnect();
  const userId = user.sub;

  // Fetch plan entries
  const fetchPlanEntries = async (userId) => {
    try {
      const result2 = await PlanEntry.find({ userId }).sort({
        discipline: 1,
        _id: -1,
      });

      const planEntries = result2.map((doc) => {
        const planEntry = JSON.parse(JSON.stringify(doc));
        planEntry._id = planEntry._id.toString();
        return planEntry;
      });
      return planEntries;
    } catch (error) {
      console.error("Error fetching plan entries:", error);
      throw new Error("Failed to fetch plan entries");
    }
  };

  const planEntries = await fetchPlanEntries(userId);

  return <PlanInteractive planEntries={planEntries} userId={userId} />;
}
