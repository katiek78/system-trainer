
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import Journey from "@/models/Journey";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import LogEntry from '@/models/LogEntry'
import './styles.css';


const LogPage = ({ user, logEntries, currentPage, totalPages }) => {
console.log(logEntries)
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
      try {
        const formattedDate = new Date(dateString).toISOString().split('T')[0];
        return formattedDate;
      }
      catch {
        return dateString;
      }
      };

   
      const getPageLink = (page) => {
        const queryParams = { ...router.query, page };
        return {
          pathname: router.pathname,
          query: queryParams,
        };
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

   // const sortedLogEntries = logEntries.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

    return (
        <>
            <div className="z-10 justify-between font-mono text-lg max-w-5xl">
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
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded" style={{ maxWidth: '100vw', overflowX: 'auto' }}>
                <h2 className="text-2xl font-semibold">My log entries</h2>
                {logEntries?.length > 0 && <h3>Click a column header to sort your entries.</h3>}
              
                
                    {logEntries?.length === 0 && 
                    <p>You have not added any entries to your training log yet.</p>
                    }
                    {logEntries?.length > 0 && (
                        <>

                        <div className="flex justify-center gap-2 mt-2 mb-4">
            {pageNumbers.length > 1 && pageNumbers.map(number => (
                <Link key={number} href={getPageLink(number)}
                className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md ${
                currentPage === number ? 'bg-gray-800 text-white' : ''
      }`}>{number}</Link>
            ))}
          </div>

                
  <table className="border-collapse border w-full responsive-table">
    <thead>
      <tr className="bg-gray-200">
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=entryDate`}>Date</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=discipline`}>Discipline</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=score`}>Score</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=correct`}>Correct</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=time`}>Time</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=journey`}>Journey</Link></th>
        <th className="border border-gray-400 px-4 py-2"><Link href={`/log?sortBy=notes`}>Notes</Link></th>
        <th className="border lg:border-gray-400 px-4 py-2"></th>
        <th className="border lg:border-gray-400 px-4 py-2"></th>
      </tr>
    </thead>
    <tbody>
      {logEntries.map(entry => (
        <tr key={entry._id}>
          <td className="lg:border border-gray-400 px-4 py-2">{formatDate(entry.entryDate)}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.discipline}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.score}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.correct}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.time}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.journeyName}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.notes}</td>
          <td className="icon-cell lg:border border-gray-400 px-4 py-2">
          <Link href="/log/[id]/editEntry" as={`/log/${entry._id}/editEntry`} legacyBehavior>
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
    )
}

export default LogPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res, query }) => {
        const { page = 1, sortBy = 'entryDate' } = query; // Get the current page from query parameters
        const auth0User = await getSession(req, res);
        const db = await dbConnect()
        const user = (auth0User).user
        const currentPage = parseInt(page);
        const entriesPerPage = 20;

        //fetch all training log entries (Eventually will need paginations)
        // const result2 = await LogEntry.find({ userId: user.sub })

        // Function to fetch log entries with pagination
        const fetchLogEntries = async (userId, page, limit) => {
            try {
            const result2 = await LogEntry.find({ userId })
                .sort({ [sortBy]: sortBy === 'entryDate' ? -1 : 1, _id: -1 }) // Sort by chosen heading
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
      
          // only want to send the name and ID of private journeys
      const result2 = await Journey.find({userId: user.sub}, { name: 1 })
      const journeys = result2.map((doc) => {   
        const journey = JSON.parse(JSON.stringify(doc));
        journey._id = journey._id.toString()
        return journey
      })
      
      //only want to send the name and ID of public images sets
      const publicJourneyResult = await Journey.find({ $or: [{ userId: null }, { userId: { $exists: false } }] }, { name: 1 });
      const publicJourneys = publicJourneyResult.map((doc) => {   
        const journey = JSON.parse(JSON.stringify(doc));
        journey._id = journey._id.toString()
        return journey
      })

      const enhancedLogEntries = logEntries.map(e => {
        if (e.journey === 'other') return {...e, journeyName: 'other'}
        if (e.journey === 'no') return {...e, journeyName: 'no journey'}
        const journeyId = e.journey
        let journeyName;
        for (let i = 0; i < journeys.length; i++) {
          if (journeys[i]._id === journeyId) {
            journeyName = journeys[i].name;
            break;
          }
        }
        for (let i = 0; i < publicJourneys.length; i++) {
          if (publicJourneys[i]._id === journeyId) {
            journeyName = publicJourneys[i].name;
            break;
          }
        }
        return {...e, journeyName};
      })

        return {
            props: {
                user: user,                
                logEntries: enhancedLogEntries,
                currentPage,
                totalPages: Math.ceil(totalNumberOfEntries / entriesPerPage),   
                journeys,
                publicJourneys            
            },
        };
    }
})

