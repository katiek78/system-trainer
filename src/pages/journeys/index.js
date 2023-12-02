
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCopy } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";

const JourneysPage = ({user, journeys, publicJourneys}) => {
  //let user = useUser(); //should we be using this instead?
    
    const [message, setMessage] = useState('')
    const contentType = 'application/json'
    const router = useRouter();

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this journey?');
        if (confirmed) {
          

            //remove it from the database
            try {
                await fetch(`/api/journeys/${id}`, {
                method: 'Delete',
                })
                refreshData(router);
            } catch (error) {
                setMessage('Failed to delete the journey.')
            }
        }
    }

    const handleCopyPublic = async (id) => {
      try {
         // Fetch the details of the public image set based on the ID
        const publicJourneyResponse = await fetch(`/api/journeys/${id}`, {
          method: 'GET',
          headers: {
            Accept: contentType,
            'Content-Type': contentType,
          },

        });       

        if (!publicJourneyResponse.ok) {
          throw new Error(publicJourneyResponse.status + " when fetching journey");
        }

         // Extract the public journey data
        const { data } = await publicJourneyResponse.json()     

        // Modify the retrieved data to include the user's ID      
        const { _id, ...modifiedJourneyData } = data;
        modifiedJourneyData.userId = user.sub; // Assuming user.sub contains the user's ID


        // POST the modified data to create a copy in the user's private sets
        const res = await fetch('/api/journeys', {
          method: 'POST',
          headers: {
            Accept: contentType,
            'Content-Type': contentType,
          },
          body: JSON.stringify(modifiedJourneyData),        
         })
   
      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status + " when copying journey")
      }

      router.push({pathname: `/journeys`})
    } catch (error) {
      setMessage('Failed to copy journey. ' + error)
    }
    }

    const sortedJourneys = journeys.sort((a, b) => a.name.localeCompare(b.name));
    const sortedPublicJourneys = publicJourneys.sort((a, b) => a.name.localeCompare(b.name));

  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Journeys</h1>

    <br />
    <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
    <h3 className="font-semibold">What is a journey?</h3>
    <p className="font-mono">A journey (or memory palace) is a series of locations (or loci) that you will use, and maybe re-use, to memorise information.</p>
    </div>

    <br />
    <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
    <h2 className="text-2xl font-semibold">My private journeys</h2>
    <p className="font-mono">You currently have {journeys.length === 0 ? 'no private ' : journeys.length + " "} {journeys.length === 1 ? 'journey' : 'journeys'}.</p>
    <br />
    {journeys.length > 0 && sortedJourneys.map(journey => <p className="font-semibold"> <Link href="/journeys/[id]/" as={`/journeys/${journey._id}/`} legacyBehavior>{journey.name}</Link> 
    <FontAwesomeIcon className="ml-5 cursor-pointer" onClick={() => handleDelete(journey._id)} icon={faTrash} size="1x" /></p>)}
    <Link href="/newJourney"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Add new journey
        </button></Link>
    </div>

    <br />
    <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
    <h2 className="text-2xl font-semibold">Public journeys</h2>
    <p className="font-mono">There {publicJourneys.length === 1 ? 'is' : 'are'} {publicJourneys.length} public {publicJourneys.length === 1 ? 'journey' : 'journeys'} available. Click the <FontAwesomeIcon icon={faCopy} size="1x" /> icon next to a journey to make a private copy of that journey, which you can then edit.</p>
<br />
    {publicJourneys.length > 0 && sortedPublicJourneys.map(journey => 
      <p className="font-semibold"> <Link href="/journeys/[id]/" as={`/journeys/${journey._id}/`} legacyBehavior>{journey.name}</Link> <FontAwesomeIcon className="ml-5 cursor-pointer" icon={faCopy} size="1x" onClick={() => handleCopyPublic(journey._id)} /></p>
    )}
      </div>
  </div>
    <div>{message}</div>
</>
  )
}

export default JourneysPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
     const db = await dbConnect()
     const user = (auth0User).user
    
  //only want to send the name and ID of private journeys
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


  // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });
  // if (!user) {
  //    user = db.user.create(auth0User?.user);
  // } 
    return {
      props: {
        // dbUser: user,
        user: (auth0User).user,
        // user: user,  //EVENTUALLY THIS      
        journeys: journeys,
        publicJourneys: publicJourneys
      },
    };
  },
})

