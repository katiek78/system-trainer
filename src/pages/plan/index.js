
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import PlanEntry from "@/models/PlanEntry";
import './styles.css';


const PlanPage = ({ user, planEntries }) => {

    const [message, setMessage] = useState('')
    const contentType = 'application/json'
    const router = useRouter();

    const getFormattedFrequencySpecifics = (str) => {
        return str;
      }
    
      const getFormattedFrequencyType = (str) => {        
        if (str === 'D') return 'day';
        if (str === 'W') return 'week';
        return 'month';
      }
    
console.log(planEntries)
    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this entry?');
        if (confirmed) {

            //remove it from the database
            try {
                await fetch(`/api/planEntries/${id}`, {
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
            <div className="z-10 justify-between font-mono text-lg max-w-5xl">
                <h1 className="py-2 font-mono text-4xl">Training plan</h1>

                <br />
                <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                    <h3 className="font-semibold">Plan your training</h3>
                    <p className="font-mono">Click 'Add entry' to plan your daily/weekly memory training. 
                        In the future, it may also be possible to generate a training plan automatically according to your goals and performance.</p>
                </div>
                <Link href="/newPlanEntry"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
                    Add entry
                </button></Link>

            </div>
            <div>{message}</div>
            <br />
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded" style={{ maxWidth: '100vw', overflowX: 'auto' }}>
                <h2 className="text-2xl font-semibold">My training plan</h2>                
              <br />
                    {planEntries?.length === 0 && 
                    <p>You have not added any entries to your training plan yet.</p>
                    }
                    {planEntries?.length > 0 && (
                        <>
                        
                
  <table className="border-collapse border w-full responsive-table">
    <thead>
      <tr className="bg-gray-200">
        <th className="border border-gray-400 px-4 py-2">Discipline</th>
        <th className="border border-gray-400 px-4 py-2">Frequency</th>
        <th className="border border-gray-400 px-4 py-2">On</th>
        <th className="border lg:border-gray-400 px-4 py-2"></th>
        <th className="border lg:border-gray-400 px-4 py-2"></th>
      </tr>
    </thead>
    <tbody>
      {planEntries.map(entry => (
        <tr key={entry._id}>          
          <td className="lg:border border-gray-400 px-4 py-2">{entry.discipline}</td>
          <td className="lg:border border-gray-400 px-4 py-2">{entry.frequency} per {getFormattedFrequencyType(entry.frequencyType)}</td>          
          <td className="lg:border border-gray-400 px-4 py-2">{getFormattedFrequencySpecifics(entry.frequencySpecifics)}</td>     
          <td className="icon-cell lg:border border-gray-400 px-4 py-2">
          <Link href="/plan/[id]/editEntry" as={`/plan/${entry._id}/editEntry`} legacyBehavior>
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

export default PlanPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
     const db = await dbConnect()
     const user = (auth0User).user

      // Function to fetch log entries with pagination
      const fetchPlanEntries = async (userId) => {
            try {
            const result2 = await PlanEntry.find({ userId })
                .sort({ discipline: 1, _id: -1 }) // Sort by discipline               

                const planEntries = result2.map((doc) => {
                    const planEntry = JSON.parse(JSON.stringify(doc));
                    planEntry._id = planEntry._id.toString()
                    return planEntry
                })
                return planEntries;
            } catch (error) {
            console.error('Error fetching plan entries:', error);
            throw new Error('Failed to fetch plan entries');  
            }         
        };


    const planEntries = await fetchPlanEntries(user.sub);
    
    return {
      props: { 
        user,
        planEntries
        //eventually will want goals and best scores here?
      },
    };
  },
})

