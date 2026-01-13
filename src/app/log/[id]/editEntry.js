import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useRouter, useParams } from "next/navigation"
import useSWR from 'swr'
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import LogEntryForm from "@/components/LogEntryForm"

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data)


const EditEntry = ({user, journeys, publicJourneys}) => {
        
    const router = useRouter()
    const params = useParams()
    const id = params?.id
    const {
      data: entry,
      error,
      isLoading,
    } = useSWR(id ? `/api/logEntries/${id}` : null, fetcher)
  
    if (error) return <p>Failed to load</p>
    if (isLoading) return <p>Loading...</p>
    if (!entry) return null  

    //entry is returned correctly
   
    const logEntryForm = {
        entryDate: entry.entryDate,    
        discipline: entry.discipline,
        score: entry.score,
        correct: entry.correct,
        time: entry.time || '',
        journey: entry.journey,
        notes: entry.notes,
      }

 
  

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Edit location</h1>
  <LogEntryForm userId={user.sub} journeys={journeys} publicJourneys={publicJourneys} formId="edit-log-entry-form" forNewEntry={false} logEntryForm={logEntryForm} />
  </div>
  </>
  )
}

export default EditEntry;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect()

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
              
    return { props: { user, journeys, publicJourneys } }
  }
})