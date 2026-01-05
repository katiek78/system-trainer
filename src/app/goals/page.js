import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Goal from "@/models/Goal";
import GoalsInteractive from "./GoalsInteractive";

export default async function GoalsPage() {
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

  // Fetch goals
  const fetchGoals = async (userId) => {
    try {
      const result2 = await Goal.find({ userId }).sort({
        dateSet: 1,
        _id: -1,
      });

      const goals = result2.map((doc) => {
        const goal = JSON.parse(JSON.stringify(doc));
        goal._id = goal._id.toString();
        return goal;
      });
      return goals;
    } catch (error) {
      console.error("Error fetching goals:", error);
      throw new Error("Failed to fetch goals");
    }
  };

  const goals = await fetchGoals(userId);

  return <GoalsInteractive goals={goals} />;
}
