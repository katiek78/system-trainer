"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";

export default function LogInteractive({
  logEntries,
  currentPage,
  totalPages,
}) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalPages); i++) {
    pageNumbers.push(i);
  }

  const formatDate = (dateString) => {
    try {
      const formattedDate = new Date(dateString).toISOString().split("T")[0];
      return formattedDate;
    } catch {
      return dateString;
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (confirmed) {
      try {
        await fetch(`/api/logEntries/${id}`, {
          method: "Delete",
        });
        router.refresh();
      } catch (error) {
        setMessage("Failed to delete the entry.");
      }
    }
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl">
        <h1 className="py-2 font-mono text-4xl">Training log</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">Log your training</h3>
          <p className="font-mono">
            Click 'Add entry' to log any memory training you have done.
            Statistics and graphs coming soon! In the future, it may also be
            possible to train in this app and your log will be updated
            automatically.
          </p>
        </div>
        <Link href="/newLogEntry">
          <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
            Add entry
          </button>
        </Link>
      </div>
      <div>{message}</div>
      <br />
      <div
        className="bg-white dark:bg-slate-800 py-5 px-5 rounded"
        style={{ maxWidth: "100vw", overflowX: "auto" }}
      >
        <h2 className="text-2xl font-semibold">My log entries</h2>
        {logEntries?.length > 0 && (
          <h3>Click a column header to sort your entries.</h3>
        )}

        {logEntries?.length === 0 && (
          <p>You have not added any entries to your training log yet.</p>
        )}
        {logEntries?.length > 0 && (
          <>
            <div className="flex justify-center gap-2 mt-2 mb-4">
              {pageNumbers.length > 1 &&
                pageNumbers.map((number) => (
                  <Link
                    key={number}
                    href={`/log?page=${number}`}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md ${
                      currentPage === number ? "bg-gray-800 text-white" : ""
                    }`}
                  >
                    {number}
                  </Link>
                ))}
            </div>

            <table className="border-collapse border w-full responsive-table">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=entryDate`}>Date</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=discipline`}>Discipline</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=score`}>Score</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=correct`}>Correct</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=time`}>Time</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=journey`}>Journey</Link>
                  </th>
                  <th className="border border-gray-400 px-4 py-2">
                    <Link href={`/log?sortBy=notes`}>Notes</Link>
                  </th>
                  <th className="border lg:border-gray-400 px-4 py-2"></th>
                  <th className="border lg:border-gray-400 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {logEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.discipline}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.score}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.correct}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.time}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.journeyName}
                    </td>
                    <td className="lg:border border-gray-400 px-4 py-2">
                      {entry.notes}
                    </td>
                    <td className="icon-cell lg:border border-gray-400 px-4 py-2">
                      <Link href={`/log/${entry._id}/editEntry`}>
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
          </>
        )}
      </div>
    </>
  );
}
