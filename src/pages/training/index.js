
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
// import SiteUser from "@/models/SiteUser";

const TrainingCenter = ({user, journeys, imageSets, systems}) => {
  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Training Center</h1>
    <p className="font-mono">Hello {user.nickname} - there are {journeys.length} journeys, {imageSets.length} image sets and {systems.length} systems in the database.</p>
  </div>

</>
  )
}

export default TrainingCenter;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    await dbConnect()

    // Fetch the user from the db (by email)
    // let user = await SiteUser.findOne({ where: { email: auth0User?.user.email } });
    
  let user;
    // You might want to move the creation of the user somewhere else like afterCallback
    // Checkout https://auth0.github.io/nextjs-auth0/modules/handlers_callback.html
    if (!user) {
      // user = db.user.create(auth0User?.user);  //EVENTUALLY SOMETHING LIKE THIS
      user = (auth0User).user
    } 
  
 

/* find all the data in our database */
const result = await Journey.find({})
  const journeys = result.map((doc) => { 
    const journey = JSON.parse(JSON.stringify(doc));
    journey._id = journey._id.toString()
    return journey
  })

  const result2 = await MemoSystem.find({})
  const systems = result2.map((doc) => {   
    const system = JSON.parse(JSON.stringify(doc));
    system._id = system._id.toString()
    return system
  })

  const result3 = await ImageSet.find({})
  const imageSets = result3.map((doc) => {   
    const imageSet = JSON.parse(JSON.stringify(doc));
    imageSet._id = imageSet._id.toString()
    return imageSet
  })

  // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });
  // if (!user) {
  //    user = db.user.create(auth0User?.user);
  // } 
    return {
      props: {
        // dbUser: user,
        // user: (auth0User).user,
        user: user,  //EVENTUALLY THIS
        journeys: journeys,
        imageSets: imageSets,
        systems: systems
      },
    };
  },
})

