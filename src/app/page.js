"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import "../pages/styles.css";
import { ML_DISCIPLINES, TRADITIONAL_DISCIPLINES } from "@/lib/disciplines";

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [randomChoice, setRandomChoice] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  const handleRandom = () => {
    const bigArrayOfDisciplines = [
      ...ML_DISCIPLINES,
      ...TRADITIONAL_DISCIPLINES,
    ];
    setShowAnimation(true);

    const timeout = setTimeout(() => {
      const choice = Math.floor(Math.random() * bigArrayOfDisciplines.length);
      setRandomChoice(bigArrayOfDisciplines[choice]);
      setShowAnimation(false);
    }, 1000);

    return () => clearTimeout(timeout);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  if (user) {
    return (
      <>
        <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
          <h1 className="font-mono text-6xl">The Memory Place</h1>
          <br />
          <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
            <h3 className="font-semibold">Welcome to The Memory Place!</h3>
            <p className="font-mono">
              Please take a look around! You can add your image sets, journeys
              and systems here to keep them all in one place and practise them.
              You can log all your memory training here too and create your own
              training plan (or have one generated for you!). More features to
              come soon. Meanwhile, get a random training suggestion by clicking
              the button below!
            </p>
          </div>
          <br />
          <button
            onClick={handleRandom}
            className="btn bg-black dark:bg-slate-500 hover:bg-gray-700 text-white text-lg font-bold mt-3 py-3 px-6 rounded focus:outline-none focus:shadow-outline"
          >
            What should I train next?
          </button>
          <br />
          {showAnimation ? (
            <div className="animation"></div>
          ) : (
            <>
              {randomChoice && (
                <div className="result bg-white dark:bg-slate-800 w-auto font-bold rounded text-lg mt-5 py-3 px-6">
                  {randomChoice}
                </div>
              )}
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
      <h1 className="font-mono text-6xl flex flex-col">The Memory Place</h1>
      <a
        className="text-blue-500 hover:text-blue-700 visited:text-blue-500 visited:hover:text-blue-700"
        href="/auth/login?screen_hint=signup"
      >
        Sign up
      </a>{" "}
      or{" "}
      <a
        className="text-blue-500 hover:text-blue-700 visited:text-blue-500 visited:hover:text-blue-700"
        href="/auth/login"
      >
        Log in
      </a>{" "}
      to get started!
    </div>
  );
}
