import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import JourneyFolderFormClient from "./NewFolderClient";

export default async function NewFolderPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return <div className="p-8 text-center">You must be logged in to view this page.</div>;
  }

  await dbConnect();
  const userId = user.sub;

  const journeyFolderForm = { name: "" };

  return <JourneyFolderFormClient userId={userId} journeyFolderForm={journeyFolderForm} />;
}
