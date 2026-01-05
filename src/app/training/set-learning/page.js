import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import TrainingSetLearning from "./TrainingSetLearning";
import { notFound } from "next/navigation";

export default async function Page({ searchParams }) {
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
  const params = await searchParams;
  const imageSetId = params?.imageSet;
  if (!imageSetId) return notFound();

  const userId = user.sub;
  // Find the image set and verify ownership or public access
  const imageSet = await ImageSet.findOne({
    _id: imageSetId,
    $or: [{ userId: userId }, { userId: null }, { userId: { $exists: false } }],
  }).lean();

  if (!imageSet) return notFound();

  return (
    <TrainingSetLearning imageSet={JSON.parse(JSON.stringify(imageSet))} />
  );
}
