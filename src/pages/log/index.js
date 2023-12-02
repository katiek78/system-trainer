
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCopy } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import LogEntry from '@/models/LogEntry'


const LogPage = ({ user, logEntries, currentPage, totalPages }) => {

    const [message, setMessage] = useState('')
    const contentType = 'application/json'
    const router = useRouter();
//     const entriesPerPage = 20;
//     const [currentPage, setCurrentPage] = useState(1);

//     const indexOfLastEntry = currentPage * entriesPerPage;
//     const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
//     const currentEntries = logEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  
// console.log(logEntries)

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(totalPages); i++) {
      pageNumbers.push(i);
    }

    const formatDate = (dateString) => {
        const formattedDate = new Date(dateString).toISOString().split('T')[0];
        return formattedDate;
      };

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this entry?');
        if (confirmed) {

            //remove it from the database
            try {
                await fetch(`/api/logEntries/${id}`, {
                    method: 'Delete',
                })
                refreshData(router);
            } catch (error) {
                setMessage('Failed to delete the entry.')
            }
        }
    }



    return (
        <>
            <div className="z-10 justify-between font-mono text-lg max-w-5xl" style={{ '@media (max-width: 768px)': { maxWidth: '100%' } }}>
                <h1 className="py-2 font-mono text-4xl">Training log</h1>

                <br />
                <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                    <h3 className="font-semibold">Log your training</h3>
                    <p className="font-mono">Click 'Add entry' to log any memory training you have done. Statistics and graphs coming soon!
                        In the future, it may also be possible to train in this app and your log will be updated automatically.</p>
                </div>
                <Link href="/newLogEntry"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                    Add entry
                </button></Link>

            </div>
            <div>{message}</div>
            <br />
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                <h2 className="text-2xl font-semibold">My log entries</h2>

                <br />
                    {logEntries.length === 0 && 
                    <p>You have not added any entries to your training log yet.</p>
                    }
                    {logEntries.length > 0 && (
                        <>

                        <div className="flex justify-center gap-2 mt-2 mb-4">
            {pageNumbers.length > 1 && pageNumbers.map(number => (
                <Link key={number} href={`/log?page=${number}`} 
                className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md ${
                currentPage === number ? 'bg-gray-800 text-white' : ''
      }`}>{number}</Link>
            ))}
          </div>

                
  <table className="border-collapse border w-full">
    <thead>
      <tr className="bg-gray-200">
        <th className="border border-gray-400 px-4 py-2">Date</th>
        <th className="border border-gray-400 px-4 py-2">Discipline</th>
        <th className="border border-gray-400 px-4 py-2">Score</th>
        <th className="border border-gray-400 px-4 py-2">Correct</th>
        <th className="border border-gray-400 px-4 py-2">Time</th>
        <th className="border border-gray-400 px-4 py-2">Journey</th>
        <th className="border border-gray-400 px-4 py-2">Notes</th>
        <th className="border border-gray-400 px-4 py-2"></th>
      </tr>
    </thead>
    <tbody>
      {logEntries.map(entry => (
        <tr key={entry._id}>
          <td className="border border-gray-400 px-4 py-2">{formatDate(entry.entryDate)}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.discipline}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.score}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.correct}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.time}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.journey}</td>
          <td className="border border-gray-400 px-4 py-2">{entry.notes}</td>
          <td className="border border-gray-400 px-4 py-2">
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
    )
}

export default LogPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res, query }) => {
        const { page } = query; // Get the current page from query parameters
        const auth0User = await getSession(req, res);
        const db = await dbConnect()
        const user = (auth0User).user
        const currentPage = parseInt(page) || 1;
        const entriesPerPage = 20;

        //fetch all training log entries (Eventually will need paginations)
        // const result2 = await LogEntry.find({ userId: user.sub })

        // Function to fetch log entries with pagination
        const fetchLogEntries = async (userId, page, limit) => {
            try {
            const result2 = await LogEntry.find({ userId })
                .sort({ entryDate: -1, _id: -1 }) // Sort by entryDate in descending order to get the latest entries first
                .skip((page - 1) * limit) // Skip records based on page number
                .limit(limit);

                const logEntries = result2.map((doc) => {
                    const logEntry = JSON.parse(JSON.stringify(doc));
                    logEntry._id = logEntry._id.toString()
                    return logEntry
                })
                return logEntries;
            } catch (error) {
            console.error('Error fetching log entries:', error);
            throw new Error('Failed to fetch log entries');  
            }         
        };

        const fetchTotalNumberOfEntries = async (userId) => {
            try {
              const count = await LogEntry.countDocuments({ userId });
              return count;
            } catch (error) {
              console.error('Error fetching total number of entries:', error);
              throw new Error('Failed to fetch total number of entries');
            }
          };

        const logEntries = await fetchLogEntries(user.sub, currentPage, entriesPerPage);
        const totalNumberOfEntries = await fetchTotalNumberOfEntries(user.sub);

        return {
            props: {
                user: (auth0User).user,                
                logEntries,
                currentPage,
                totalPages: Math.ceil(totalNumberOfEntries / entriesPerPage),
            },
        };
    }
})

