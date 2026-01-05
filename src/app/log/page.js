import { auth0 } from "@/lib/auth0";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import Journey from "@/models/Journey";
import LogEntry from "@/models/LogEntry";
import LogInteractive from "./LogInteractive";

export default async function LogPage({ searchParams }) {
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
  const userId = user.sub;

  const params = await searchParams;
  const page = parseInt(params?.page || "1");
  const sortBy = params?.sortBy || "entryDate";
  const entriesPerPage = 20;

  // Function to fetch log entries with pagination
  const fetchLogEntries = async (userId, page, limit, sortBy) => {
    try {
      let result2;
      if (sortBy === "journey") {
        result2 = await LogEntry.aggregate([
          { $match: { userId: userId } },
          {
            $lookup: {
              from: "journeys",
              let: { journeyId: "$journey" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toString: "$_id" }, "$$journeyId"],
                    },
                  },
                },
              ],
              as: "journeyDetails",
            },
          },
          { $unwind: "$journeyDetails" },
          {
            $sort: {
              "journeyDetails.name": 1,
              _id: -1,
            },
          },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ]).exec();
      } else {
        result2 = await LogEntry.find({ userId })
          .sort({ [sortBy]: sortBy === "entryDate" ? -1 : 1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
      }

      const logEntries = result2.map((doc) => {
        const logEntry = JSON.parse(JSON.stringify(doc));
        logEntry._id = logEntry._id.toString();
        return logEntry;
      });
      return logEntries;
    } catch (error) {
      console.error("Error fetching log entries:", error);
      throw new Error("Failed to fetch log entries");
    }
  };

  const fetchTotalNumberOfEntries = async (userId) => {
    try {
      const count = await LogEntry.countDocuments({ userId });
      return count;
    } catch (error) {
      console.error("Error fetching total number of entries:", error);
      throw new Error("Failed to fetch total number of entries");
    }
  };

  const logEntries = await fetchLogEntries(
    userId,
    page,
    entriesPerPage,
    sortBy
  );
  const totalNumberOfEntries = await fetchTotalNumberOfEntries(userId);

  // Fetch journeys for name mapping
  const result2 = await Journey.find({ userId: userId }, { name: 1 });
  const journeys = result2.map((doc) => ({
    _id: doc._id.toString(),
    name: doc.name,
  }));

  const publicJourneyResult = await Journey.find(
    { $or: [{ userId: null }, { userId: { $exists: false } }] },
    { name: 1 }
  );
  const publicJourneys = publicJourneyResult.map((doc) => ({
    _id: doc._id.toString(),
    name: doc.name,
  }));

  // Enhance log entries with journey names
  const enhancedLogEntries = logEntries.map((e) => {
    if (e.journey === "other") return { ...e, journeyName: "other" };
    if (e.journey === "no") return { ...e, journeyName: "no journey" };
    const journeyId = e.journey;
    let journeyName;
    for (let i = 0; i < journeys.length; i++) {
      if (journeys[i]._id === journeyId) {
        journeyName = journeys[i].name;
        break;
      }
    }
    if (!journeyName) {
      for (let i = 0; i < publicJourneys.length; i++) {
        if (publicJourneys[i]._id === journeyId) {
          journeyName = publicJourneys[i].name;
          break;
        }
      }
    }
    return { ...e, journeyName };
  });

  return (
    <LogInteractive
      logEntries={enhancedLogEntries}
      currentPage={page}
      totalPages={Math.ceil(totalNumberOfEntries / entriesPerPage)}
    />
  );
}
