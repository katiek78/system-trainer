"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faCheck } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/utilities/day";

export default function GoalsInteractive({ goals: initialGoals }) {
  const [message, setMessage] = useState("");
  const [goals, setGoals] = useState(initialGoals);
  const router = useRouter();

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );
    if (confirmed) {
      try {
        await fetch(`/api/goals/${id}`, {
          method: "Delete",
        });
        // Remove the deleted goal from state
        setGoals(goals.filter((goal) => goal._id !== id));
        router.refresh();
      } catch (error) {
        setMessage("Failed to delete the goal.");
      }
    }
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl">
        <h1 className="py-2 font-mono text-4xl">Goals</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Set your goals</h3>
          <p className="font-mono">
            Click &apos;Add goal&apos; to add a training goal and a timeframe.
            In the future, you will be able to auto-generate training plans
            based on your goals. For now, you can view this page as a regular
            reminder of your aims!
          </p>
        </div>
      </div>
      <div>{message}</div>
      <br />
      <div
        className="bg-white dark:bg-slate-800 py-5 px-5 rounded"
        style={{ maxWidth: "100vw", overflowX: "auto" }}
      >
        <h2 className="text-2xl font-semibold">My goals</h2>

        <Link href="/goals/new">
          <button className="btn bg-black hover:bg-gray-700 text-white font-bold my-4 py-2 px-6 rounded focus:outline-none focus:shadow-outline">
            Add goal
          </button>
        </Link>

        <br />
        {goals?.length === 0 && <p>You have not added any goals yet.</p>}
        {goals?.length > 0 && (
          <table className="border-collapse border w-full responsive-table-plan">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-4 py-2">Start date</th>
                <th className="border border-gray-400 px-4 py-2">End date</th>
                <th className="border border-gray-400 px-4 py-2">Discipline</th>
                <th className="border lg:border-gray-400 px-4 py-2">
                  Score / Time
                </th>
                <th className="border lg:border-gray-400 px-4 py-2">
                  Achieved
                </th>
                <th className="border lg:border-gray-400 px-4 py-2"></th>
                <th className="border lg:border-gray-400 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={goal._id}>
                  <td className="lg:border border-gray-400 px-4 py-2">
                    {formatDate(goal.startDate)}
                  </td>
                  <td className="lg:border border-gray-400 px-4 py-2 font-bold">
                    {formatDate(goal.endDate)}
                  </td>
                  <td className="lg:border border-gray-400 px-4 py-2">
                    {goal.discipline}
                  </td>
                  <td className="lg:border border-gray-400 px-4 py-2">
                    {goal.score ? goal.score : goal.time + "s"}
                  </td>
                  <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                    {goal.achieved && (
                      <FontAwesomeIcon
                        className="cursor-pointer"
                        icon={faCheck}
                        size="1x"
                      />
                    )}
                  </td>
                  <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                    <Link href={`/goals/${goal._id}/editGoal`}>
                      <FontAwesomeIcon
                        className="cursor-pointer"
                        icon={faEdit}
                        size="1x"
                      />
                    </Link>
                  </td>
                  <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                    <FontAwesomeIcon
                      className="cursor-pointer"
                      onClick={() => handleDelete(goal._id)}
                      icon={faTrash}
                      size="1x"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
