import { auth0 } from "@/lib/auth0";

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
        <div className="bg-white dark:bg-slate-800 py-5 px-3 sm:px-5 rounded mb-4">
          <h3 className="font-semibold mb-3">BPM Data Provider</h3>
          <p className="font-mono mb-3">
            This page will help you find songs with the right tempo for your memory training.
          </p>
          <p className="font-mono mb-3">
            BPM data provided by:{" "}
            <a
              href="https://getsongbpm.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GetSongBPM API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
