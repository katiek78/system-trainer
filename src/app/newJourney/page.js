import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import NewJourneyClient from "./NewJourneyClient";

export default async function NewJourneyPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return <div className="p-8 text-center">You must be logged in to view this page.</div>;
  }

  await dbConnect();
  const userId = user.sub;

  const journeyForm = {
    name: "",
  };

  return <NewJourneyClient userId={userId} journeyForm={journeyForm} />;
}
