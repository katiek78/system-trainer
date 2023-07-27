
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState, useEffect, useRef} from "react";
import { useRouter } from "next/router";
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
import TrafficLights from "@/components/TrafficLights";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faEdit } from "@fortawesome/free-solid-svg-icons";

// import SiteUser from "@/models/SiteUser";

const TrainingCenter = ({user, journeys, imageSets, systems}) => {
  const router = useRouter();
  const contentType = 'application/json'

  const [message, setMessage] = useState('');
  const imageSetID = router.query.imageSet;
  const [imageSet, setImageSet] = useState({});
  const [randImage, setRandImage] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFrontSide, setIsFrontSide] = useState(true);
  // const [isStarted, setIsStarted] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const [form, setForm] = useState({
    imageItem: ''   
  })
  
  useEffect(() => {
    setIsLoading(true);
    setImageSet(getImageSet(imageSetID));
    setIsLoading(false);

  }, [imageSetID]);

  const toggleRotate = (toFront = false) => {
    console.log("rotate toggled" + toFront)
    if ((toFront && document.querySelectorAll('.card-flip')[0].classList.contains("[transform:rotateY(180deg)]")) || !toFront) {
          document.querySelectorAll('.card-flip').forEach(card => card.classList.toggle('[transform:rotateY(180deg)]'));
        }
    console.log(isFrontSide)
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
    })
    const data = await res.json();   
    setImageSet(data.data);
  }

  function handleKeyDown(e) { 
    e.stopPropagation(); 
    if (document.getElementsByName('imageItem').length > 0) {
      console.log("special key down thing called")   
      if (e.keyCode === 13) console.log("pressed return on input")
    } else {
      console.log("normal key down thing called")         
      if (e.keyCode === 39) getNextImage();
      if (e.keyCode === 13 || e.keyCode === 32) toggleRotate();  
  }    
}

  

  const handleStartTraining = () => {
    //get random image from set
    const randIndex = Math.floor(Math.random() * imageSet.images.length);
    setRandImage(imageSet.images[randIndex]);   
    setForm({imageItem: randImage.imageItem});
    // setIsStarted(true);

     //document.addEventListener('keydown', handleKeyDown);
     
     document.addEventListener('keydown', handleKeyDown)
     
  }

  const handleNextImage = (e) => {        
             e.preventDefault();
             e.target.blur();
             getNextImage();     
             
  }

  const getNextImage = () => {
    //get random image from set    
    const randIndex = Math.floor(Math.random() * imageSet.images.length);
    setRandImage(imageSet.images[randIndex]);    
    toggleRotate(true);     
    setIsEditable(false);
    setForm({imageItem: imageSet.images[randIndex].imageItem});
    //console.log(imageSet.images.filter(img => img.recentAttempts?.length > 0))
  }

//   function handleKeyDownEdit(k) {      
//     console.log("special key down thing called")
//    // k.stopPropagation();        
//     if (k.keyCode === 13) console.log("pressed return on input");      
// }

  const handleEdit = (e) => {
    //Now entering editable mode
    e.stopPropagation();
    setIsEditable(true);
        
   //document.addEventListener('keydown', handleKeyDown);
  //  document.removeEventListener('keydown', handleKeyDown, true);
  //  console.log("normal key down thing should be off now");
  //  document.addEventListener('keydown', handleKeyDownEdit)
  }

  const handleCorrect = (id) => {    
    addToRecentAttempts(true, id);        
    getNextImage();
  }

  const handleIncorrect = (id) => {
    addToRecentAttempts(false, id);        
    getNextImage();
  }

  const addToRecentAttempts = async (isCorrect) => {
    const thisImage = randImage;
    //create the property if it doesn't exist
    if (!thisImage.recentAttempts) thisImage.recentAttempts = [];

    //cap at 6 attempts
    if (thisImage.recentAttempts.length === 6) thisImage.recentAttempts.shift();
  
    thisImage.recentAttempts.push(isCorrect ? 1 : 0);

    const updatedImages = imageSet.images.map((el) =>
    el._id === thisImage._id ? { ...el, recentAttempts: thisImage.recentAttempts } : el
    )
    
    //console.log(updatedImages);

    //get updated imageSet
    const updatedImageSet = {...imageSet, images: updatedImages};
    
    try {
            
      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(updatedImageSet),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
      const { data } = await res.json()

      mutate(`/api/imageSets/${imageSetID}`, data, false) // Update the local data without a revalidation         
     // setImageSet(data);       

    } catch (error) {
      setMessage('Failed to save training data')
    }
     
    //   refreshData();
   
   
  }

  const handleSubmitEdit = async (e) => {
    e.stopPropagation();

    setIsEditable(false); 
    // document.removeEventListener('keydown', handleKeyDownEdit, true);
    // document.addEventListener('keydown', handleKeyDown)
    
    const thisImage = randImage;
   
    thisImage.imageItem = form.imageItem;

    const updatedImages = imageSet.images.map((el) =>
    el._id === thisImage._id ? { ...el, imageItem:thisImage.imageItem } : el
    )
    
    //get updated imageSet
    const updatedImageSet = {...imageSet, images: updatedImages};
    
    try {
            
      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(updatedImageSet),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
      const { data } = await res.json()


    
      mutate(`/api/imageSets/${imageSetID}`, data, false) // Update the local data without a revalidation         
     // setImageSet(data);    
        

    } catch (error) {
      setMessage('Failed to save training data')
    }
     
    //   refreshData();
   
   
  }

  const handleEditChange = (e) => {
    e.stopPropagation();
    const target = e.target
    const value = target.value
    const name = target.name

    setForm({
      ...form,
      [name]: value,
    })
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
    {imageSet?.images?.length > 0 && !randImage.name && <button onClick={handleStartTraining} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Start</button>}
    {randImage.name &&
    <div className="flex flex-col justify-center items-center">

      <div class="group [perspective:1000px]">
        <div class="z-3 relative m-2 h-40 w-60 rounded-xl shadow-xl">
          <div id="card-front" onClick={() => toggleRotate(false)}  className="card-flip absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]">
          <div class="flex-col rounded-xl px-12  text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="text-3xl font-bold">{randImage.name}</h1>         
            </div> 
          </div>
          <div id="card-back" onClick={() => toggleRotate(false)}  className="card-flip absolute inset-0 h-full w-full  rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div class="flex-col rounded-xl bg-black/60 px-12  text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="text-3xl font-bold">{isEditable ? <div><input name='imageItem' onChange={handleEditChange} onClick={(e) => e.stopPropagation()} className='text-black w-44 rounded-xl absolute top-2 left-1' value={form.imageItem}></input>{randImage.name}</div> : randImage.imageItem}</h1>                  
              <h5><TrafficLights recentAttempts={randImage.recentAttempts} /></h5> 
              
            </div> 
            {isEditable ? <FontAwesomeIcon className='absolute left-3/4 top-3/4 text-white' icon={faCheck} onClick={handleSubmitEdit} /> : <FontAwesomeIcon className='absolute left-3/4 top-3/4 text-white' icon={faEdit} onClick={handleEdit} />}
            <img class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40" src={randImage.URL && randImage.URL.length > 0 ? randImage.URL : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"} alt="" />
          </div>
        </div>
      </div>
    
      <FontAwesomeIcon className='cursor-pointer h-10 w-40 btn bg-green-400 hover:bg-green-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={handleCorrect} icon={faCheck} />
      <FontAwesomeIcon className='cursor-pointer h-10 w-40 btn bg-red-400 hover:bg-red-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={handleIncorrect} icon={faXmark} />  
      <button onClick={(e) => handleNextImage(e)} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Next</button>
    </div>
    }
    </div>
    </>
    }
    <div>{}</div>
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

