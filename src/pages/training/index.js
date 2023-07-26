
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState, useEffect} from "react";
import { useRouter } from "next/router";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
// import SiteUser from "@/models/SiteUser";

const TrainingCenter = ({user, journeys, imageSets, systems}) => {
  const router = useRouter();
  const contentType = 'application/json'
  const imageSetID = router.query.imageSet;
  const [imageSet, setImageSet] = useState({});
  const [randImage, setRandImage] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFrontSide, setIsFrontSide] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setImageSet(getImageSet(imageSetID));
    setIsLoading(false);
  }, [imageSetID]);

  const toggleRotate = (e) => {
   // let list = e.target.classList
    //list.toggle('[transform:rotateY(180deg)]')
    //let cards = document.getElementsByClassName("card-flip");
    
    document.querySelectorAll('.card-flip').forEach(card => card.classList.toggle('[transform:rotateY(180deg)]'));
   // list.toggle('[transform:rotateY(180deg)]')
    // group-hover[transform:rotateY(180deg)]

    setIsFrontSide(!isFrontSide);
  }

  const getImageSet = async (id) => {
    //get image set from DB
    const res = await fetch(`/api/imageSets/${id}`, {
      method: 'GET',
      headers: {
        Accept: contentType,
        'Content-Type': contentType,
      },
      //body: JSON.stringify({...imageSet, images: imageArray}),
    })
    const data = await res.json();
    console.log(data);
    setImageSet(data.data);
  }

  const handleStartTraining = () => {
    //get random image from set
    const randIndex = Math.floor(Math.random() * imageSet.images.length);
    setRandImage(imageSet.images[randIndex]);
  }

  const handleNextImage = () => {
        //get random image from set
        const randIndex = Math.floor(Math.random() * imageSet.images.length);
        setRandImage(imageSet.images[randIndex]);
        if (!isFrontSide) toggleRotate();        
  }

  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Training Center</h1>
    <p className="font-mono">Hello {user.nickname} - there are {journeys.length} journeys, {imageSets.length} image sets and {systems.length} systems in the database.</p>
    
    {imageSet && !isLoading && 
    <>
    <div className="flex flex-col justify-center items-center">
    <div className="mt-10 font-mono text-3xl">{imageSet.name}</div>
    {!randImage.name && <button onClick={handleStartTraining} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Start</button>}
    {randImage.name &&
    <div className="flex flex-col justify-center items-center">

      <div class="group [perspective:1000px]">
        <div class="z-3 relative m-2 h-40 w-60 rounded-xl shadow-xl">
          <div id="card-front" onClick={(e) => toggleRotate(e)}  className="card-flip absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]">
          <div class="flex-col rounded-xl px-12  text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="text-3xl font-bold">{randImage.name}</h1>         
            </div> 
          </div>
          <div id="card-back" onClick={(e) => toggleRotate(e)}  className="card-flip absolute inset-0 h-full w-full  rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div class="flex-col rounded-xl bg-black/60 px-12  text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="text-3xl font-bold">{randImage.imageItem}</h1>         
            </div> 
            <img class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40" src={randImage.URL && randImage.URL.length > 0 ? randImage.URL : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"} alt="" />
          </div>
        </div>
      </div>


    <button onClick={handleNextImage} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Next</button>
    </div>
    }
    </div>
    </>
    }
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

