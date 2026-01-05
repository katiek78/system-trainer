"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import GoalForm from "@/components/GoalForm";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data);

export default function EditGoal() {
  const params = useParams();
  const id = params.id;
  const { user, error: userError, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, userLoading, router]);

  const {
    data: goal,
    error,
    isLoading,
  } = useSWR(id ? `/api/goals/${id}` : null, fetcher);

  if (userLoading || !user) return <p>Loading...</p>;
  if (error) return <p>Failed to load</p>;
  if (isLoading) return <p>Loading...</p>;
  if (!goal) return null;

  const goalForm = {
    startDate: goal.startDate,
    endDate: goal.endDate,
    discipline: goal.discipline,
    score: goal.score,
    time: goal.time || "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Edit goal</h1>
        <GoalForm
          formId="edit-goal-form"
          forNewEntry={false}
          goalForm={goalForm}
        />
      </div>
    </>
  );
}
