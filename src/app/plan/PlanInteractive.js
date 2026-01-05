"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faMagic } from "@fortawesome/free-solid-svg-icons";
import SmallFrequencySpecific from "@/components/SmallFrequencySpecific";
import AutoGenerate from "@/components/AutoGenerate";
import { generatePlan } from "@/utilities/generatePlan";
import { WEEKDAYS, DAY_COLOURS } from "@/utilities/day";
import "./styles.css";

export default function PlanInteractive({ planEntries, userId }) {
  const [message, setMessage] = useState("");
  const [isAGButtonDisabled, setIsAGButtonDisabled] = useState(false);
  const [isDisciplineView, setIsDisciplineView] = useState(true);
  const [today, setToday] = useState("");
  const [activeTab, setActiveTab] = useState(WEEKDAYS[0]);

  const contentType = "application/json";
  const router = useRouter();

  useEffect(() => {
    const currentDate = new Date();
    const currentDay =
      WEEKDAYS[(currentDate.getDay() - 1 + WEEKDAYS.length) % WEEKDAYS.length];
    setToday(currentDay);
    setActiveTab(currentDay);
  }, []);

  const getFormattedFrequencyType = (str) => {
    if (str === "D") return "day";
    if (str === "W") return "week";
    return "month";
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (confirmed) {
      try {
        await fetch(`/api/planEntries/${id}`, {
          method: "Delete",
        });
        router.refresh();
      } catch (error) {
        setMessage("Failed to delete the entry.");
      }
    }
  };

  const handleClickAutoGenerate = () => {
    setIsAGButtonDisabled(true);
  };

  const autoGenerateForm = {
    minutes: 0,
    ML: true,
    traditional: true,
    IAMImages: true,
    AI: true,
  };

  const handleCancelClick = () => {
    setIsAGButtonDisabled(false);
  };

  const handleGenerate = (form) => {
    const plan = generatePlan(
      form.minutes,
      form.ML,
      form.traditional,
      form.IAMImages,
      form.AI
    );
    savePlan(plan);
  };

  const handleDisciplineView = () => {
    setIsDisciplineView(true);
  };

  const handleDayView = () => {
    setIsDisciplineView(false);
  };

  const savePlan = async (plan) => {
    // Remove all existing plan entries for this user
    try {
      await fetch(`/api/planEntries/user/${userId}`, {
        method: "Delete",
      });
    } catch (error) {
      setMessage("Failed to delete existing entries.");
    }

    // Add the userId to each plan entry
    plan = plan.map((p) => ({ ...p, userId: userId }));

    // Insert the plan entries
    try {
      const res = await fetch(`/api/planEntries/user/${userId}`, {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(plan),
      });

      if (!res.ok) {
        throw new Error(res.status);
      }

      router.push(`/plan`);
      router.refresh();
    } catch (error) {
      setMessage("Failed to add plan entries");
    }
  };

  const openDay = (day) => {
    setActiveTab(day);
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl">
        <h1 className="py-2 font-mono text-4xl">Training plan</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Plan your training</h3>
          <p className="font-mono">
            Click 'Add entry' to plan your daily/weekly/monthly memory training.
            You can also click 'Auto-generate' to create a weekly training plan
            that fits the time you have available. It's also possible to edit
            your plan afterwards.
          </p>
        </div>
      </div>
      <div>{message}</div>
      <br />
      <div
        className="bg-white dark:bg-slate-800 py-5 px-5 rounded"
        style={{ maxWidth: "100vw", overflowX: "auto" }}
      >
        <h2 className="text-2xl font-semibold">My training plan</h2>

        <Link href="/newPlanEntry">
          <button className="btn bg-black hover:bg-gray-700 text-white font-bold my-4 py-2 px-6 rounded focus:outline-none focus:shadow-outline">
            Add entry
          </button>
        </Link>
        <button
          onClick={handleClickAutoGenerate}
          disabled={isAGButtonDisabled}
          className={`btn ${
            isAGButtonDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-700 hover:to-blue-700"
          } text-white font-bold mt-3 py-2 px-6 rounded focus:outline-none focus:shadow-outline flex items-center`}
        >
          Auto-generate <FontAwesomeIcon icon={faMagic} className="ml-2" />
        </button>
        {isAGButtonDisabled && (
          <AutoGenerate
            formId="auto-generate-form"
            doesPlanExist={planEntries.length > 0}
            autoGenerateForm={autoGenerateForm}
            onCancelClick={handleCancelClick}
            onGenerate={handleGenerate}
          />
        )}
        <br />
        {planEntries?.length === 0 && (
          <p>You have not added any entries to your training plan yet.</p>
        )}
        {planEntries?.length > 0 && (
          <>
            <div className="flex justify-center">
              <p
                onClick={handleDisciplineView}
                className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${
                  isDisciplineView ? "active-view" : ""
                }`}
              >
                Discipline view
              </p>
              <p className="lg:text-3xl sm:text-2xl mr-3">|</p>
              <p
                onClick={handleDayView}
                className={`cursor-pointer mr-3 mb-3 lg:text-3xl sm:text-2xl ${
                  !isDisciplineView ? "active-view" : ""
                }`}
              >
                Day view
              </p>
            </div>

            {isDisciplineView && (
              <table className="border-collapse border w-full responsive-table-plan">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-4 py-2">
                      Discipline
                    </th>
                    <th className="border border-gray-400 px-4 py-2">
                      Frequency
                    </th>
                    <th className="border border-gray-400 px-4 py-2">On</th>
                    <th className="border lg:border-gray-400 px-4 py-2"></th>
                    <th className="border lg:border-gray-400 px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {planEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="lg:border border-gray-400 px-4 py-2">
                        {entry.discipline}
                      </td>
                      <td className="lg:border border-gray-400 px-4 py-2">
                        {entry.frequency} per{" "}
                        {getFormattedFrequencyType(entry.frequencyType)}
                      </td>
                      <td className="lg:border border-gray-400 px-4 py-2">
                        <div className=" flex gap-2">
                          {entry.frequencySpecifics
                            .sort(
                              (a, b) =>
                                WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)
                            )
                            .map((el, index) => (
                              <SmallFrequencySpecific key={index} day={el} />
                            ))}
                        </div>
                      </td>
                      <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                        <Link href={`/plan/${entry._id}/editEntry`}>
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
                          onClick={() => handleDelete(entry._id)}
                          icon={faTrash}
                          size="1x"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isDisciplineView && (
              <div className="tabs">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    className={`tablinks ${activeTab === day ? "active" : ""}`}
                    onClick={() => openDay(day)}
                    style={{
                      backgroundColor: DAY_COLOURS[day] || "lightgrey",
                    }}
                  >
                    {day}
                  </button>
                ))}

                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    id={day}
                    className={`tabcontent ${
                      activeTab === day ? "active" : ""
                    }`}
                    style={{ display: activeTab === day ? "block" : "none" }}
                  >
                    {today === day && (
                      <p className="lg:text-4xl md:text-3xl sm:text-3xl mt-3 font-bold">
                        Today's plan:
                      </p>
                    )}

                    <div>
                      {(() => {
                        const disciplinesCount = {};

                        // Count occurrences of each discipline for the specified day
                        planEntries.forEach((entry) => {
                          if (entry.frequencySpecifics.includes(day)) {
                            if (!disciplinesCount[entry.discipline]) {
                              disciplinesCount[entry.discipline] =
                                entry.frequencySpecifics.filter(
                                  (spec) => spec === day
                                ).length;
                            } else {
                              disciplinesCount[entry.discipline] +=
                                entry.frequencySpecifics.filter(
                                  (spec) => spec === day
                                ).length;
                            }
                          }
                        });

                        // Render each discipline based on its count
                        const renderedDisciplines = [];
                        Object.keys(disciplinesCount).forEach((discipline) => {
                          const repetitions = disciplinesCount[discipline];
                          for (let i = 0; i < repetitions; i++) {
                            renderedDisciplines.push(
                              <div
                                key={`${discipline}-${i}`}
                                className="lg:mt-5 sm:mt-3 lg:text-3xl sm:text-2xl"
                              >
                                {discipline}
                              </div>
                            );
                          }
                        });

                        return renderedDisciplines;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
