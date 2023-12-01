import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import dbConnect from "@/lib/dbConnect";
import Journey from "@/models/Journey";
import EmbedStreetView from "@/components/EmbedStreetView"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEdit, faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarOutline } from "@fortawesome/free-regular-svg-icons"
import { refreshData } from "@/lib/refreshData";
import './styles.css';

const JourneyPage = ({user, journey}) => {
    const router = useRouter()    
    const contentType = 'application/json'
   // const [journey, setJourney] = useState({});
    const [currentPage, setCurrentPage] = useState(1);   
    const [message, setMessage] = useState('')
    
    const [isListView, setIsListView] = useState(true);
    const [isEditable, setIsEditable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
   
    const [journeyForm, setJourneyForm] = useState({})
    const [pointForm, setPointForm] = useState({})
    // const [importPointsForm, setImportPointsForm] = useState({imageSetFrom: '', overwrite: false})
    // const [populateForm, setPopulateForm] = useState({     
    //   setType: 'other'      
    // })

console.log(journey)
    const pageLimit = 20;

    // const getJourney = async (id) => {

    //   //get journey from DB
    //   const res = await fetch(`/api/journeys/${id}/${currentPage-1}`, {
    //     method: 'GET',
    //     headers: {
    //       Accept: contentType,
    //       'Content-Type': contentType,
    //     },
    //   })
    //   const data = await res.json();
    //   setJourney(data.data);
      
    // //   setPointForm({name: data.data.name,   
    // //     points: data.data.points } )
     
    // }

    
    useEffect(() => {
      setIsLoading(true);
      setJourneyForm({name: journey.name } )
      const id = router.query.id
      //get image set here
    
    
       // getJourney(id);

      setIsLoading(false);
    }, [currentPage]);



    const renderPageNumbers = () => {   
      if (isEditable) return <div className="mt-3 mx-0.5 h-10"></div> 
        let div = [];
        const BUTTON_MAX = 10; //how many buttons are shown before there should be a '...'
        const totalButtons = Math.ceil(points.length / pageLimit);
        const buttonsToBeShown = Math.min(BUTTON_MAX, totalButtons) //lower of maximum and total buttons
        const isEven = BUTTON_MAX % 2 === 0
        const numberToShowBeforeCurrentPage = isEven ? BUTTON_MAX / 2 + 1 : (BUTTON_MAX - 1)/2   //6 when we have 10 buttons max
    
        //const firstButton = (currentPage <= numberToShowBeforeCurrentPage) ? 0 : currentPage - numberToShowBeforeCurrentPage 
        let firstButton;
        if (currentPage <= numberToShowBeforeCurrentPage) {
          firstButton = 0
        } else if (currentPage > totalButtons - BUTTON_MAX + numberToShowBeforeCurrentPage) { // unless we are in last BUTTON_MAX-nts buttons because then there are none showing after
          firstButton = totalButtons - BUTTON_MAX;
        } else firstButton = currentPage - numberToShowBeforeCurrentPage
        
        const lastButton = Math.min(firstButton + buttonsToBeShown - 1, totalButtons - 1);
       
        const isThereMoreAtEnd = lastButton < totalButtons - 1;
        const isThereMoreAtStart = firstButton > 0;

        if (isThereMoreAtStart) {
          let i = 0;
          const firstInRange = i*pageLimit;
          const lastInRange = i*pageLimit + pageLimit - 1 < points.length ? i*pageLimit + pageLimit - 1 : points.length - 1;
          div.push(<button className='btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}><RedHeartsAndDiamonds text={firstInRange} />-<RedHeartsAndDiamonds text={lastInRange} /></button>);
          div.push(" ... ");
        
        }

        for (let i = firstButton; i <= lastButton; i++) { 
            const firstInRange =i*pageLimit;
            const lastInRange = i*pageLimit + pageLimit - 1 < points.length ? i*pageLimit + pageLimit - 1 : points.length - 1;
            if (i === currentPage - 1) {
                div.push(<button className='btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}>firstInRange-lastInRange</button>);
            } else div.push(<button className='btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}>firstInRange-lastInRange</button>);
        }

        if (isThereMoreAtEnd) {
          div.push(" ... ");
          let i = totalButtons - 1;
          const firstInRange = i*pageLimit;
          const lastInRange = i*pageLimit + pageLimit - 1 < points.length ? i*pageLimit + pageLimit - 1 : points.length - 1;
          div.push(<button className='btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}>firstInRange-lastInRange</button>);
        }

        let jump;
        if (points.length > 1000) {
          jump = 500
        } else if (points.length > 100) {
          jump = 100;
        };

        const options = points.map((item, index) => {
          if (index % jump === 0) {
            const entryNumber = index / pageLimit;
            return (
              <option key={entryNumber} value={entryNumber + 1}>
                {item.name}
              </option>
            );
          }
          return null;
        });

        if (jump) div.push(<><span>  Jump to: </span>
        <select id="entry" onChange={() => handlePageChange(document.getElementById("entry").options[document.getElementById("entry").selectedIndex].value)}>
          {/* Add default option   <option value="">-- Select an option --</option> */}          
          {options}
        </select></>)
        return div;
    };

    // const handlePageChange = (page) => {
    //     setCurrentPage(page);
    //   }


      const putDataJourney = async (journeyForm) => {
          
       const { id } = router.query       
      
       try {
         
         const res = await fetch(`/api/journeys/${id}`, {
           method: 'PUT',
           headers: {
             Accept: contentType,
             'Content-Type': contentType,
           },
           body: JSON.stringify({name: journeyForm.name, points: []}),
         })
   
         // Throw error with status code in case Fetch API req failed
         if (!res.ok) {
           throw new Error(res.status)
         }
   
         const { data } = await res.json()
   
       } catch (error) {
         setMessage('Failed to update journey')
       }
     }

    //   const putDataImages = async (imageForm) => {
          
    //    const { id } = router.query       
      
    //    try {
         
    //      const res = await fetch(`/api/imageSets/${id}/${currentPage}`, {
    //        method: 'PUT',
    //        headers: {
    //          Accept: contentType,
    //          'Content-Type': contentType,
    //        },
    //        body: JSON.stringify({name: imageForm.name, images: imageForm.images}),
    //      })
   
    //      // Throw error with status code in case Fetch API req failed
    //      if (!res.ok) {
    //        throw new Error(res.status)
    //      }
   
    //      const { data } = await res.json()
   
    //    } catch (error) {
    //      setMessage('Failed to update images')
    //    }
    //  }
    

    //   const handleChangePointForm = (e) => {
    //     const target = e.target     
    //     const value = target.value
    //     const name = target.name
       
    //     const updatedForm = { ...pointForm };        
      
    //     let thisIndex;        
        
    // }

    const handleDelete = async () => {
        const journeyID = router.query.id

        try {
            await fetch(`/api/journeys/${journeyID}`, {
            method: 'Delete',
            })
            router.push(`/journeys`)      
        } catch (error) {
            setMessage('Failed to delete the journey.')
        }
        }

        const handleDeletePoint = async (pointID, e) => {
    console.log("deleting point")
            try {
              await fetch(`/api/points/${pointID}`, {
                method: 'Delete',
              })           
             // router.push(`/`) 
              refreshData(router);
            } catch (error) {
              setMessage('Failed to delete the point.')
            }
          }

  const handleChangeTitle = (e) => {
    setJourneyForm({...journeyForm, name: e.target.value})        
  }

  const handleToggleEditable = () => {
    setIsEditable(!isEditable);    
  }

//   /* Makes sure image set info is filled */
//   const formValidate = () => {
//     let err = {}
//     if (!form.name) err.name = 'Name is required'
   
//     return err
//   }

      const handleSubmitJourneyForm = (e) => {
        e.preventDefault()
        
        putDataJourney(journeyForm)
        setIsEditable(false);
      }

 
    // const updatedForm = { ...pointForm };            
    // const thisIndex = findIndexById(updatedForm.images, id);
    // if (thisIndex) updatedForm.images[thisIndex].starred = thisImage.starred
   
    // setPointForm(updatedForm);
    
    // try {

    //   const res = await fetch(`/api/imageSets/${journey._id}`, {
    //     method: 'PUT',
    //     headers: {
    //       Accept: contentType,
    //       'Content-Type': contentType,
    //     },
    //     body: JSON.stringify(thisImage),
    //   })

    //   // Throw error with status code in case Fetch API req failed
    //   if (!res.ok) {
    //     throw new Error(res.status)
    //   }
    //   const { data } = await res.json()
  
    // } catch (error) { 
    //   setMessage('Failed to save image')
    // }




    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">Journey:
    <h1 className="py-2 font-mono text-5xl">{isEditable ? <input onChange={handleChangeTitle} className='text-4xl' size='50' value={journeyForm.name}></input> : journeyForm.name}
    {isEditable ? 
          <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer ml-5" onClick={handleSubmitJourneyForm} icon={faCheck} size="1x" />
        :<> <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer ml-5" onClick={handleToggleEditable} icon={faEdit} size="1x" />
        <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer ml-5" onClick={handleDelete} icon={faTrash} size="1x" />        </>
        }
    </h1> 

    <div class='journey-btn-container'>
        <Link href="/journeys/[id]/new" as={`/journeys/${journey._id}/new`} legacyBehavior>
        <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Add a location</button>
        </Link>        
      </div>

  <div className="relative w-full overflow-hidden py-5 px-5 rounded bg-white" style={{ minHeight: '400px' }}>
  <h2 className="mb-5 text-2xl font-semibold">Locations:</h2>
  <div className="p-5 flex flex-wrap">
   
   
    {journey.points?.map(point => (
      <div className="point-card relative mb-4" key={point._id}>
        <div className="card-content">
          <p className="point-name text-center whitespace-normal">{point.name}</p>
          <div className="street-view-container relative w-max">
            <EmbedStreetView
              width={300}
              height={200}
              location={point.location}
              heading={point.heading || 90}
              pitch={point.pitch || 0}
              fov={point.fov || 100}
            />
            <div className="icon-container flex flex-row space-x-3 p-3 justify-end items-end">
              <Link href="/[id]/editPoint" as={`/${point._id}/editPoint`} legacyBehavior>
                <FontAwesomeIcon icon={faEdit} size="2x" />
              </Link>
              <FontAwesomeIcon className="ml-5" icon={faTrash} size="2x" onClick={() => handleDeletePoint(point._id)} />          
            </div>
          </div>
        </div>
      </div>
    ))}

    <div className="plusIcon flex items-center justify-center mb-16">
    <Link href="/journeys/[id]/new" as={`/journeys/${journey._id}/new`} legacyBehavior>
    <FontAwesomeIcon className="cursor-pointer bg-gray-200 rounded p-10" icon={faPlus} size="5x" />
    </Link>
    </div>
    
  </div>
</div>


<div>{message}</div>

    {/* Add a button to add an image manually */}
  </div>

</>


    );
    }

export default JourneyPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
  
    const journeyResult = await Journey.find({userId: user.sub, _id: params.id})
    const journey = JSON.parse(JSON.stringify(journeyResult))[0]
  
    if (journey && journey._id) journey._id = journey._id.toString()
   

    return { props: { user, journey }}
  }
})