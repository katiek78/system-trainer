"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PlanEntryForm from "@/components/PlanEntryForm";

export default function NewPlanEntryPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <p>Loading...</p>;

  const planEntryForm = {
    discipline: "",
    frequency: "",
    frequencySpecifics: [],
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">New training plan entry</h1>

        <PlanEntryForm formId="add-plan-entry-form" planEntryForm={planEntryForm} />
      </div>
    </>
  );
}
