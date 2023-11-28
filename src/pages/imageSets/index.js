
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";

const ImageSetsPage = ({user, imageSets, publicImageSets}) => {
  //let user = useUser(); //should we be using this instead?
    
    const [message, setMessage] = useState('')
    const router = useRouter();
    
    const handleDelete = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this set?');
        if (confirmed) {
            //remove it from our word set so it disappears from the view 
            //setFilterData(filterData.filter(word => word._id !== id));

            //remove it from the database
            try {
                await fetch(`/api/imageSets/${id}`, {
                method: 'Delete',
                })
                refreshData(router);
            } catch (error) {
                setMessage('Failed to delete the set.')
            }
        }
    }

  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Image sets</h1>

    <br />
    <div className="bg-white py-5 px-5 rounded">
    <h3 className="font-semibold">What is an image set?</h3>
    <p className="font-mono">An image set is a group of images or words, each one associated with a digit or group of digits, or a card or group of cards. 
      For instance, if you use a 2-digit approach, you'll need an image set that assigns an image to each pair of digits from 00 to 99 (e.g. '00' is 'sauce', '01' is a 'seat').</p>
    </div>

    <br />
    <div className="bg-white py-5 px-5 rounded">
    <h2 className="text-2xl font-semibold">My private image sets</h2>
    <p className="font-mono">You currently have {imageSets.length === 0 ? 'no private ' : imageSets.length} image {imageSets.length === 1 ? 'set' : 'sets'}.</p>
    <br />
    {imageSets.length > 0 && imageSets.map(imageSet => <p className="font-semibold"> <Link href="/imageSets/[id]/" as={`/imageSets/${imageSet._id}/`} legacyBehavior>{imageSet.name}</Link> 
    <FontAwesomeIcon className="ml-5 cursor-pointer" onClick={() => handleDelete(imageSet._id)} icon={faTrash} size="1x" /></p>)}
    <Link href="/newImageSet"><button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Add new image set
        </button></Link>
    </div>

    <br />
    <div className="bg-white py-5 px-5 rounded">
    <h2 className="text-2xl font-semibold">Public image sets</h2>
    <p className="font-mono">There {publicImageSets.length === 1 ? 'is' : 'are'} {publicImageSets.length} public image {publicImageSets.length === 1 ? 'set' : 'sets'} available. Click the 'add' icon to make a private copy of the image set that you can edit.</p>
<br />
    {publicImageSets.length > 0 && publicImageSets.map(imageSet => <p className="font-semibold"> <Link href="/imageSets/[id]/" as={`/imageSets/${imageSet._id}/`} legacyBehavior>{imageSet.name}</Link></p>)}
      </div>
  </div>
    <div>{message}</div>
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

  //only want to send the name and ID of private image sets
  const result2 = await ImageSet.find({userId: user.sub}, { name: 1 })
  const imageSets = result2.map((doc) => {   
    const imageSet = JSON.parse(JSON.stringify(doc));
    imageSet._id = imageSet._id.toString()
    return imageSet
  })

  //only want to send the name and ID of public images sets
  const publicImageSetResult = await ImageSet.find({ $or: [{ userId: null }, { userId: { $exists: false } }] }, { name: 1 });
  const publicImageSets = publicImageSetResult.map((doc) => {   
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
        imageSets: imageSets,
        publicImageSets: publicImageSets
      },
    };
  },
})

