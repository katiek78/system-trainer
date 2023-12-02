import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import LogEntryForm from "@/components/LogEntryForm";

const NewLogEntryPage = ({user, journeys, publicJourneys}) => {

    const logEntryForm = {
        notes: ''
    }
console.log("tomato")
  console.log(journeys);

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New training log entry</h1>
    
    
    <LogEntryForm userId={user.sub} journeys={journeys} publicJourneys={publicJourneys} formId="add-log-entry-form" logEntryForm={logEntryForm} />
   
  </div>

</>

    );

}

export default NewLogEntryPage

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