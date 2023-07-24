
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
//import dbConnect from "@/lib/dbConnect";
import MemoSystem from "@/models/MemoSystem";
import Link from "next/link";

const SystemsPage = ({user, systems}) => {
  //let user = useUser(); //should we be using this instead?
  
  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">My systems</h1>
    <p className="font-mono">Hi {user.nickname} - there are {systems.length} systems in the database.</p>
    {systems.length > 0 && systems.map(system => <p className="font-semibold"> <Link href="/[id]/" as={`/${system._id}/`} legacyBehavior>{system.name}</Link></p>)}
    
  </div>

</>
  )
}

export default SystemsPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
   // const db = await dbConnect()

    // Fetch the user from the db (by email)
    // let user = await SiteUser.findOne({ where: { email: auth0User?.user.email } });
    

    // You might want to move the creation of the user somewhere else like afterCallback
    // Checkout https://auth0.github.io/nextjs-auth0/modules/handlers_callback.html
    // if (!user) {
      // user = db.user.create(auth0User?.user);  //EVENTUALLY SOMETHING LIKE THIS
     const user = (auth0User).user
    // } 
  
 

/* find all the data in our database */
// const result = await Journey.find({})
//   const journeys = result.map((doc) => { 
//     const journey = JSON.parse(JSON.stringify(doc));
//     journey._id = journey._id.toString()
//     return journey
//   })

  const result2 = await MemoSystem.find({})
  const systems = result2.map((doc) => {   
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
        // user: user,  //EVENTUALLY THIS
       
        systems: systems
      },
    };
  },
})

