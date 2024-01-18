
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState, useEffect, useRef} from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
// import Journey from "@/models/Journey";
// import MemoSystem from "@/models/MemoSystem";
import ImageSet from "@/models/ImageSet";
import TrafficLights from "@/components/TrafficLights";
import ConfidenceLevel from "@/components/ConfidenceLevel";
import QuickEditForm from "@/components/QuickEditForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark, faEdit, faImage, faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline }  from "@fortawesome/free-regular-svg-icons";
import { confidenceLabels, getConfidenceLevel } from "@/utilities/confidenceLevel";
import RedHeartsAndDiamonds from "@/components/RedHD";
import { determineSetType } from "@/utilities/setType";

// import SiteUser from "@/models/SiteUser";

const TrainingCenter = ({user, imageSet}) => {
  const router = useRouter();
  const contentType = 'application/json'

  const [message, setMessage] = useState('');
  const imageSetID = router.query.imageSet;
  //const [updatableImageSet, setUpdatableImageSet] = useState(imageSet);
  //const [imageSet, setImageSet] = useState({});
  const [randImage, setRandImage] = useState({});
  const [isStarred, setIsStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [isFrontSide, setIsFrontSide] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [imageGroup, setImageGroup] = useState('all');
  const [filteredData, setFilteredData] = useState(imageSet.images);
  const [needNewCard, setNeedNewCard] = useState(false);
  const [field, setField] = useState('imageItem')
  const [starredOnly, setStarredOnly] = useState(false);
  const [cardsAvailable, setCardsAvailable] = useState(false);
// let filteredData = [];

  const setType = determineSetType(imageSet.images.length);

  useEffect(() => {
    if (isLoading) return;
    setIsLoading(true);
    setCardsAvailable(false);
    
    //console.log(imageSet.images[1926]); //outdated 'starred' but correct name and recentAttempts?
    //console.log(filteredData.filter(el => el.imageItem.includes("nightshade"))); //correct

    //const filterData = () => {
      let newSet = [...imageSet.images];      
      if (imageGroup !== 'all' && imageGroup !== 'bf' && imageGroup !== 'rf') newSet = newSet.filter(image => getConfidenceLevel(image.recentAttempts) === parseInt(imageGroup));
      if (imageGroup === 'bf') {
        newSet = newSet.filter((image) => /^[^\p{L}]*[♠♣].*[♦♥]/u.test(image.name) || /^[^\p{L}]*[♠♣].*[♠♣]/u.test(image.name));
      }
      if (imageGroup === 'rf') {
        newSet = newSet.filter((image) =>  /^[^\p{L}]*[♦♥].*[♠♣]/u.test(image.name) || /^[^\p{L}]*[♦♥].*[♦♥]/u.test(image.name));
      }
 
      if (starredOnly) newSet = newSet.filter(image => image.starred)
      setFilteredData(newSet, starredOnly);
   // }

  //  filterData();
  
   if (filteredData.length) {
    getImage();
    toggleRotate(null, true);
    setIsEditable(false);
    setMessage('');
    setCardsAvailable(true);
  } else {
    setMessage('There are no cards of this type! Choose another.');
   // setCardsAvailable(false);
  }
    setNeedNewCard(false);
    setIsLoading(false);
    
  }, [needNewCard]);

  const toggleRotate = (e, toFront = false) => {
       if (!isEditable) {
          if (toFront || (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg' && e.target.tagName !== 'path')) {   //if it's called in getNextImage or is not triggered via the button, then we consider toggle
      
          if ((toFront && document.querySelectorAll('.card-flip').length > 0 && document.querySelectorAll('.card-flip')[0].classList.contains("[transform:rotateY(180deg)]")) || !toFront) {
                document.querySelectorAll('.card-flip').forEach(card => card.classList.toggle('[transform:rotateY(180deg)]'));
              }

            }
    }
  }

  const getGroupTotals = () => {
   // console.log("getting group totals - this means page has refreshed") //this happens when you change select, when you click Start, when you click submit, when you press correct
    let result = [];
    for (let i = 0; i < confidenceLabels.length; i++) {
      const group = imageSet.images.filter(image => getConfidenceLevel(image.recentAttempts) === parseInt(i))
      result.push(group.length);
    }
    return result;
  }

  const groupTotals = getGroupTotals();

  // const getImageSet = async (id) => {
  //   //get image set from DB
  //   const res = await fetch(`/api/imageSets/${id}`, {
  //     method: 'GET',
  //     headers: {
  //       Accept: contentType,
  //       'Content-Type': contentType,
  //     },
  //   })
  //   const data = await res.json();
  //   setImageSet(data.data);
  // }

  function handleKeyDown(e) {
   e.stopPropagation();
  //   //can't do preventDefault or it stops us typing
  // console.log(e.target)
  //   //console.log("just pressed a key and form.imageItem is " + form.imageItem) //if we've pressed return, this has somehow been reset to ''

  //   if (document.getElementsByName('imageItem').length > 0) {
  //     //console.log("special key down thing called")
  //     if (e.keyCode === 13) handleSubmitEdit(e, formItem);
  //   } else {
    
  if (e.keyCode === 39)  setNeedNewCard(true);
  //     // if (e.keyCode === 13 || e.keyCode === 32) toggleRotate();
 // }
}



  const handleStartTraining = () => {
    //get random image from set
    // const randIndex = Math.floor(Math.random() * imageSet.images.length);
    // setRandImage(imageSet.images[randIndex]);
    
     document.addEventListener('keydown', handleKeyDown)
    // getImage()
    setNeedNewCard(true)
    setIsStarted(true)

  }

  const handleNextImage = (e) => {
             e.preventDefault();
             e.target.blur();
             setNeedNewCard(true);
  }


  const getImage = () => {
 //get random image from set
 
 const randIndex = Math.floor(Math.random() * filteredData.length);
 setRandImage(filteredData[randIndex]);
 setIsStarred(filteredData[randIndex].starred)
  }


//   function handleKeyDownEdit(k) {
//     console.log("special key down thing called")
//    // k.stopPropagation();
//     if (k.keyCode === 13) console.log("pressed return on input");
// }

  const handleEdit = (e, field) => {
    //Now entering editable mode
    e.stopPropagation();
    setIsEditable(true);
    setField(field);

   //document.addEventListener('keydown', handleKeyDown);
  //  document.removeEventListener('keydown', handleKeyDown, true);
  //  console.log("normal key down thing should be off now");
  //  document.addEventListener('keydown', handleKeyDownEdit)
  }

  const handleCorrect = (e) => {
    e.stopPropagation();
    addToRecentAttempts(true);
    setNeedNewCard(true);
  }

  const handleIncorrect = (e) => {
    e.stopPropagation();
    addToRecentAttempts(false);
    setNeedNewCard(true);
  }

  const addToRecentAttempts = async (isCorrect) => {
    
    //create the property if it doesn't exist
    if (!randImage.recentAttempts) randImage.recentAttempts = [];

    //cap at 7 attempts
    if (randImage.recentAttempts.length === 7) randImage.recentAttempts.shift();

    randImage.recentAttempts.push(isCorrect ? 1 : 0);

    try {

      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(randImage),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
      const { data } = await res.json()

      //imageSet.images = updatedImages;

      const level = document.getElementById("selSet").value;   
      setImageGroup(level)     //this makes sure the categories are updated, I think this works by causing a re-render which causes updating of groupTotals

    } catch (error) {
      setMessage(error + 'Failed to save training data')
    }

    //   refreshData();
    


  }

  const handleSubmitEdit = async (e, field, item) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditable(false);
   
    if (field === 'imageItem') {
    randImage.imageItem = item;
    
    } else if (field === 'URL') {
      randImage.URL = item
   
    } else {
     
      if (randImage.starred === undefined) randImage.starred = false;
      randImage.starred = !randImage.starred
      setIsStarred(randImage.starred)
     
    }


    try {

      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(randImage),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
      const { data } = await res.json()
  
    } catch (error) { 
      setMessage('Failed to save training data')
    }

    //   refreshData();


  }


  const handleChangeSelect = () => {
    const level = document.getElementById("selSet").value;      
    setImageGroup(level)
    setNeedNewCard(true);    
  }

  const handleToggleStar = async (id) => {
    
    if (randImage.starred === undefined) randImage.starred = false;
    randImage.starred = !randImage.starred;

    setIsStarred(randImage.starred)

    try {

      const res = await fetch(`/api/imageSets/${imageSetID}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(randImage),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }
      const { data } = await res.json()     

    } catch (error) { 
      setMessage('Failed to toggle star - ' + error)
    }
   }

const handleToggleStarredDisplay = () => {
  setStarredOnly(!starredOnly);
  setNeedNewCard(true)
}

  return(
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    {/* <h1 className="py-2 font-mono text-4xl">Training Centre</h1> */} 
    {/* Soon this will be part of a Training Centre where you can do drills etc. but not yet */}
  <h2 className="text-4xl">Image set training</h2>
  <Link href="/imageSets/[id]" as={`/imageSets/${imageSet._id}`} legacyBehavior>&lt;&lt; Back to image set page</Link>
    {imageSet && !isLoading &&
    <>
    <div className="flex flex-col justify-center items-center">
    <div className="mt-10 font-mono text-3xl">{imageSet.name}</div>

    <div>
    <p>Which images do you want to train?</p>

    <select id="selSet" className="w-full rounded-md dark:bg-slate-800" onChange={handleChangeSelect}>
      <option value="all">All 🌍</option>
      {confidenceLabels.map((label, i) => <option value={i}>{label} ({groupTotals && groupTotals[i]})</option>)}   
      {setType === '2c' &&
        <>
        <option value="bf">Black-first</option>
        <option value="rf">Red-first</option>
        </>
      }   
    </select>
    </div>

    <div>Starred only? <input type="checkbox" value="false" onChange={handleToggleStarredDisplay}></input></div>

    {!isStarted && <button onClick={handleStartTraining} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Start</button>}
    {isStarted && cardsAvailable &&
    <div className="flex flex-col justify-center items-center">

      <div class="group [perspective:1000px]">
        <div class="z-3 relative m-2 h-40 w-60 lg:h-80 lg:w-96 rounded-xl shadow-xl "> 
          <div id="card-front" onClick={(e) => toggleRotate(e, false)}  className="card-flip absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]">
          <div class="flex-col rounded-xl px-12 bg-white text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="text-3xl font-bold"><RedHeartsAndDiamonds text={randImage.name} /></h1>
            </div>
          </div>
          <div id="card-back" onClick={(e) => toggleRotate(e, false)}  className="card-flip absolute inset-0 h-full w-full  rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div class="flex-col rounded-xl bg-black/40 text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <h1 class="lg:text-3xl text-2xl font-bold">{isEditable ? <QuickEditForm formId="quick-edit-form" field={field} name={randImage.name} item={field === 'imageItem' ? randImage.imageItem : randImage.URL} handleSubmitEdit={handleSubmitEdit} /> : randImage.imageItem}</h1>
              <h5 class="lg:text-lg text-sm">{randImage.phonetics}</h5>   
              <h5 class=""><TrafficLights recentAttempts={randImage.recentAttempts} /></h5>
              <ConfidenceLevel recentAttempts={randImage.recentAttempts} />

            </div>
            {randImage.starred ? <FontAwesomeIcon onClick={() => handleToggleStar(randImage._id)} className='absolute top-7 left-3 text-yellow-500' icon={faStar} />  : <FontAwesomeIcon onClick={() => handleToggleStar(randImage._id)} className='absolute top-7 left-3 text-white' icon={faStarOutline} /> }            
            {isEditable ? <></>: <><FontAwesomeIcon className='cursor-pointer absolute left-3/4 top-3/4 text-white h-6 lg:h-8' icon={faEdit} onClick={(e) => handleEdit(e, 'imageItem')} /><FontAwesomeIcon className='absolute cursor-pointer left-[87%] top-3/4 text-white h-6 lg:h-8' icon={faImage} onClick={(e) => handleEdit(e, 'URL')} /></>}
            <img class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40" src={randImage.URL && randImage.URL.length > 0 ? randImage.URL : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"} alt="" />
          </div>
        </div>
      </div>
      <div className={isEditable ? "invisible" : "flex flex-col items-center"}>
      <FontAwesomeIcon className='cursor-pointer h-10 w-40 btn bg-green-400 hover:bg-green-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={handleCorrect} icon={faCheck} />
      <FontAwesomeIcon className='cursor-pointer h-10 w-40 btn bg-red-400 hover:bg-red-500 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={handleIncorrect} icon={faXmark} />
      <button onClick={(e) => handleNextImage(e)} className="w-40 btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Next</button>
      </div>
    </div>
    }
    </div>
    </>
    }
    <div>{message}</div>
  </div>

</>
  )
}

export default TrainingCenter;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async (ctx) => {
      
      const id = ctx.query.imageSet
      {/* const id = req.params.imageSet; */}
    const auth0User = await getSession(ctx.req, ctx.res);
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
{/* const result = await Journey.find({})
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
  }) */}


  /* find this image set */
  const result = await ImageSet.findOne({_id: id})
  const imageSetToPass = JSON.parse(JSON.stringify(result))


  return { props: { user: user, imageSet: imageSetToPass} }

}
})

