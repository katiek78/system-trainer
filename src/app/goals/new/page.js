"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GoalForm from "@/components/GoalForm";

export default function NewGoalPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <p>Loading...</p>;

  const goalForm = {
    startDate: "",
    endDate: "",
    discipline: "",
    score: 0,
    time: 0,
    achieved: false,
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">New training goal</h1>

        <GoalForm formId="add-goal-form" goalForm={goalForm} />
      </div>
    </>
  );
}
