import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
import Link from "next/link";

const SystemPage = ({user, imageSets, system}) => {
    //get actual names of each imageSet included in this system
    const includedImageSetNames = system.imageSets.map(el => {
        const matchingImageSet = imageSets.find((imgSet) => imgSet._id === el);
        return matchingImageSet ? matchingImageSet.name : null;
    })

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{system.name}</h1>
   
    {system.imageSets.length > 0 && includedImageSetNames.map(el =>
    <p>{el}</p>) //Eventually you want delete button, move up/down buttons next to each set and the option to select another set to include
    }
   
    {system.imageSets.length === 0 && imageSets.length > 0 && <p>You have not included any image sets in your system. Select an image set or sets to include - e.g. for PAO, select your P, then A, then O system. For a 3-digit system where you have two images per locus, select your 3-digit set twice.</p>}
   
    {imageSets.length === 0 && <><p>You haven't created any image sets yet. Create your first image set and then you can include it in a system.</p>
     <Link href="/newImageSet" as={`/newImageSet`}><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Add an image set
        </button>
        </Link></>}

   
  </div>

</>


    );

}

export default SystemPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
  
    const system = await MemoSystem.findById(params.id).lean()
    system._id = system._id.toString()

    const result = await ImageSet.find({})
    const imageSets = result.map((doc) => {   
    const imageSet = JSON.parse(JSON.stringify(doc));
    imageSet._id = imageSet._id.toString()
    return imageSet
    })
  
    return { props: { user, imageSets, system } }
  }
})