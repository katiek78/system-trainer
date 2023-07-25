
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import Link from "next/link";

const ImageSetsPage = ({user, imageSets}) => {
  //let user = useUser(); //should we be using this instead?
  
  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">My image sets</h1>
    <p className="font-mono">Hi {user.nickname} - there are {imageSets.length} image sets in the database.</p>
    {imageSets.length > 0 && imageSets.map(imageSet => <p className="font-semibold"> <Link href="/imageSets/[id]/" as={`/imageSets/${imageSet._id}/`} legacyBehavior>{imageSet.name}</Link></p>)}
    <Link href="/newImageSet"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Add new image set
        </button></Link>
  </div>

</>
  )
}

export default ImageSetsPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
     const db = await dbConnect()

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

  const result2 = await ImageSet.find({})
  const imageSets = result2.map((doc) => {   
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
        user: (auth0User).user,
        // user: user,  //EVENTUALLY THIS
       
        imageSets: imageSets
      },
    };
  },
})

