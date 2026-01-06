import { auth0 } from "@/lib/auth0";
import TimingInteractive from "./TimingInteractive";

export default async function TimingPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="p-8 text-center">
        You must be logged in to view this page.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-transparent">
      <div className="z-10 font-mono text-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-2 sm:px-4 md:px-8">
        <h1 className="py-2 font-mono text-3xl sm:text-4xl text-center">
          Timing
        </h1>
        <TimingInteractive />
      </div>
    </div>
  );
}
