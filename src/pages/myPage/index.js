
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import System from "@/models/System";
import Link from "next/link";

const Dashboard = ({user, journeys, systems}) => {
  
  return(
    <>
<p>Hello {user.nickname} - there are {journeys.length} journeys and {systems.length} systems in the database.</p>
</>
  )
}

export default Dashboard;

// export default Dashboard;
export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
   await dbConnect()

    // Fetch the user from the db (by email)
   // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });

    // You might want to move the creation of the user somewhere else like afterCallback
    // Checkout https://auth0.github.io/nextjs-auth0/modules/handlers_callback.html
    // if (!user) {
    //   user = db.user.create(auth0User?.user);
    // } 

/* find all the data in our database */
const result = await Journey.find({})
  const journeys = result.map((doc) => {
    //const journey = doc.toObject()
    const journey = JSON.parse(JSON.stringify(doc));
    journey._id = journey._id.toString()
    return journey
  })

  const result2 = await System.find({})
  const systems = result2.map((doc) => {
    //const journey = doc.toObject()
    const system = JSON.parse(JSON.stringify(doc));
    system._id = system._id.toString()
    return system
  })

  // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });
  // if (!user) {
  //    user = db.user.create(auth0User?.user);
  // } 
    return {
      props: {
        // dbUser: user,
        user: (auth0User).user,
        // user: user,
        journeys: journeys,
        systems: systems
      },
    };
  },
})

