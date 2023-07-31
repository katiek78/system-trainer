import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faDumbbell, faEdit, faGrip, faList } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { getPopulatedImageArray } from "@/lib/getPopulatedImageArray";
import TrafficLights from "@/components/TrafficLights";
import ConfidenceLevel from "@/components/ConfidenceLevel";

const ImageSetPage = ({user, total}) => {
    const router = useRouter()    
    const contentType = 'application/json'
    const [imageSet, setImageSet] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [imageForm, setImageForm] = useState({      
           
    })
    
    useEffect(() => {
      setIsLoading(true);
      const id = router.query.id
      //get image set here
    
      const getImageSet = async (id) => {
        console.log(id)
          //get image set from DB
          const res = await fetch(`/api/imageSets/${id}/${currentPage-1}`, {
            method: 'GET',
            headers: {
              Accept: contentType,
              'Content-Type': contentType,
            },
          })
          const data = await res.json();
          setImageSet(data.data);
          setImageForm({name: data.data.name,       
            images: data.data.images } )            
        }
        getImageSet(id);

      setIsLoading(false);
    }, [currentPage]);

    
    const pageLimit = 20;
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState('')
    const [isListView, setIsListView] = useState(true);
    const [isEditable, setIsEditable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
  
 
    const [populateForm, setPopulateForm] = useState({     
      setType: 'other'      
    })

    const renderPageNumbers = () => {  
      if (isEditable) return <div className="mt-3 mx-0.5 h-10"></div> 
        let div = [];
        for (let i = 0; i < total / pageLimit; i++) {        
            if (i === currentPage - 1) {
                div.push(<button className='btn bg-white text-black font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}>{i+1}</button>);
            } else div.push(<button className='btn bg-black hover:bg-gray-700 text-white font-bold mt-3 mx-0.5 py-1 px-4 rounded focus:outline-none focus:shadow-outline' onClick={() => handlePageChange(i+1)} key={i+1}>{i+1}</button>);
        }
        return div;
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
      }

    const putDataPopulate = async (populateForm) => {
        const imageArray = getPopulatedImageArray(populateForm.setType);
        
        const { id } = router.query
        try {
          setImageForm({...imageForm, images: imageArray})
          const res = await fetch(`/api/imageSets/${id}`, {
            method: 'PUT',
            headers: {
              Accept: contentType,
              'Content-Type': contentType,
            },
            body: JSON.stringify({...imageSet, images: imageArray}),
          })
    
          // Throw error with status code in case Fetch API req failed
          if (!res.ok) {
            throw new Error(res.status)
          }
    
          const { data } = await res.json()
    
          mutate(`/api/imageSets/${id}`, data, false) // Update the local data without a revalidation
          refreshData(router);          
          
        } catch (error) {
          setMessage('Failed to add images to set')
        }
      }

      const putDataImages = async (imageForm) => {

        function replaceElementsWithNewImages(originalArray, i, newImages) {
                 
          // Replace elements starting from index `i`
          for (let j = 0; j < newImages.length; j++) {
            if (i + j < originalArray.length) {
              originalArray[i + j] = newImages[j];
            } else {
              originalArray.push(newImages[j]);
            }
          }
        
          return originalArray
        }
       
       // replaceElementsWithNewImages
          
       const { id } = router.query
       console.log(imageForm.images) // these are correct so req.body must be correct
      
       try {
         
         const res = await fetch(`/api/imageSets/${id}/${currentPage}`, {
           method: 'PUT',
           headers: {
             Accept: contentType,
             'Content-Type': contentType,
           },
           body: JSON.stringify({name: imageForm.name, images: imageForm.images}),
         })
   
         // Throw error with status code in case Fetch API req failed
         if (!res.ok) {
           throw new Error(res.status)
         }
   
         const { data } = await res.json()
   
   //      mutate(`/api/imageSets/${id}`, data, false) // Update the local data without a revalidation
     //    refreshData(router);
         console.log(imageSet); //this shows the correct images
         console.log(data) //this shows the whole set but the first 20 are the imageSet
       } catch (error) {
         setMessage('Failed to update images')
       }
     }
    

      const handleChangeImageForm = (e) => {
        const target = e.target     
        const value = target.value
        const name = target.name
       
        const updatedForm = { ...imageForm };        
        const isURL = name.includes("URL");
        let thisIndex;        
        if (isURL) {
            thisIndex = name.slice(6) % pageLimit; 
            updatedForm.images[thisIndex].URL = value;
        } else {
            thisIndex = name.slice(8) % pageLimit;
            updatedForm.images[thisIndex].imageItem = value;     
        }
        setImageForm(updatedForm);
    }

  const handleChangePopulateForm = (e) => {
    const target = e.target
    const value = target.value
    const name = target.name

    setPopulateForm({
      ...populateForm,
      [name]: value,
    })
  }

  const handleChangeTitle = (e) => {
    setImageForm({...imageForm, name: e.target.value})    
  }


//   /* Makes sure image set info is filled */
//   const formValidate = () => {
//     let err = {}
//     if (!form.name) err.name = 'Name is required'
   
//     return err
//   }

    const handleSubmitPopulateForm = (e) => {
        e.preventDefault()
        
        putDataPopulate(populateForm)
       
      }

      const handleSubmitImageForm = (e) => {
        e.preventDefault()
        
        putDataImages(imageForm)
        setIsEditable(false);
      }

    const handleToggleEditable = () => {
        setIsEditable(!isEditable);
        setIsListView(true);
    }

    const handleToggleListView = () => {
        setIsListView(!isListView);
    }

    const handleTraining = () => {
        router.push("/training?imageSet=" + imageSet._id)
    }

    const toggleRotate = (e, toFront = false) => {
        if (!isListView) {
           if (toFront || (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'svg' && e.target.tagName !== 'path')) {   //if it's called in getNextImage or is not triggered via the button, then we consider toggle
       
           if ((toFront && document.querySelectorAll('.card-flip').length > 0 && document.querySelectorAll('.card-flip')[0].classList.contains("[transform:rotateY(180deg)]")) || !toFront) {
                 document.querySelectorAll('.card-flip').forEach(card => card.classList.toggle('[transform:rotateY(180deg)]'));
               }
 
             }
     }
   }

  
console.log(total)

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{isEditable ? <input onChange={handleChangeTitle} className='text-4xl' size='50' value={imageForm.name}></input> : imageForm.name}</h1> 
    
    <div className="flex flex-row">
       

        <div className={isEditable ? "invisible flex flex-row basis-1/3" : "flex flex-row basis-1/3"}>        
            <div className="">
            <FontAwesomeIcon className={isListView ? "px-3 rounded bg-white text-black text-6xl" : "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer"} onClick={handleToggleListView} icon={faList} size="3x" />
            </div>
            <div className="ml-2">
            <FontAwesomeIcon className={isListView ? "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer" : "px-3 rounded bg-white text-black text-6xl"} onClick={handleToggleListView} icon={faGrip} size="3x" />        
            </div>
        </div>

        <div className="basis-1/3">
        {isEditable ? 
        <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleSubmitImageForm} icon={faCheck} size="3x" />
        : <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleToggleEditable} icon={faEdit} size="3x" />
        }
        </div>

        <div className="basis-1/3">
        {!isEditable && 
        <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleTraining} icon={faDumbbell} size="3x" />        
        }
        </div>
    </div>
   
    <div>{renderPageNumbers()}</div>

    {isListView &&
    <div className="mt-3 w-full grid lg:grid-cols-3 gap-y-10">
    {/* {!isLoading && imageSet && imageSet.images && imageSet.images.length > 0 && imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img,i) => { */}
      {!isLoading && imageSet && imageSet.images && imageSet.images.length > 0 && imageSet.images.map((img,i) => {
        if (isEditable) {
            return <>
            <div className="col-span-1">{img.name}</div>
            <div className="col-span-1"><input onChange={handleChangeImageForm} value={img.imageItem} id={'inpImage' + (i + (currentPage-1)*pageLimit)} name={'inpImage' + (i + (currentPage-1) * pageLimit)}></input></div>
            <div className="col-span-1"><input onChange={handleChangeImageForm} value={img.URL ? img.URL : ''} id={'inpURL' + (i + (currentPage-1)*pageLimit)} name={'inpURL' + (i + (currentPage-1) * pageLimit)}></input></div>
            </>
        } else return <>
        <div className="col-span-1">{img.name}</div>
        <div className="col-span-1">{img.imageItem || '<none entered>'}</div>
        <div className="col-span-1">{img.URL && img.URL.length && <img className='h-8' src={img.URL}></img>}</div>
        </>
      })
    }
    
    </div>
    }   

    {!isListView &&
    
        <div className="flex flex-wrap">
    {/* Create a card for each imageItem */}
   {/* {!isLoading && imageSet && imageSet.images && imageSet.images.length > 0 && imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img) => ( */}
    {!isLoading && imageSet && imageSet.images && imageSet.images.length > 0 && imageSet.images.map((img) => (
      <>

      <div class="group [perspective:1000px]">
    <div class="z-3 relative m-2 h-40 w-60 rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
      <div class="absolute inset-0 rounded-xl border-4 border-slate-700 bg-white [backface-visibility:hidden]">
      <div class="flex-col rounded-xl px-12  text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <h1 class="text-3xl font-bold">{img.name}</h1>         
        </div> 
      </div>
      <div class="absolute inset-0 h-full w-full  rounded-xl  [transform:rotateY(180deg)] [backface-visibility:hidden]">
         <div class="flex-col rounded-xl bg-black/60 px-12  text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <h1 class="text-3xl font-bold">{img.imageItem}</h1>   
          <h5 class="mt-3 text-2xl"><TrafficLights recentAttempts={img.recentAttempts} /></h5>   
          <ConfidenceLevel recentAttempts={img.recentAttempts} />        
        </div> 
        <img class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40" src={img.URL && img.URL.length > 0 ? img.URL : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"} alt="" />
      </div>
    </div>
  </div>
     
 </>
    ))}
    </div>

    
    
    }

    {!isLoading && imageSet && imageSet.images && imageSet.images.length === 0 && 
    <>
    <p>You have not added any images to this set. <br />
    Add some images manually, or select the set type and then click Populate Set to add the images automatically (e.g. 000-999 for a 3-digit set). </p>
    
    <form className ="rounded pt-6 pb-8 mb-4" id="populate-set-form" onSubmit={handleSubmitPopulateForm}>
        
        <label htmlFor="setType">What type of set is this?</label>
        <select         
          name="setType"
          value={populateForm.setType || 'other'}
          onChange={handleChangePopulateForm}
          className="ml-3"
          required
                >
        <option value="2d">2-digit</option>
        <option value="3d">3-digit</option>        
        <option value="4d">4-digit</option>
        <option value="1c">1-card</option>
        <option value="2c">2-card</option>
        <option value="other">other</option>
        </select>
<br />
        <button type="submit" className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Populate Set
        </button>
    
      </form>
      </>
    }

<div>{message}</div>

    {/* Add a button to add an image manually */}
  </div>

</>


    );

}

export default ImageSetPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
  
    //get total number of images (should be an easier way with $size or $count and/or $aggregate but can't seem to do it)
    const total = await ImageSet.findOne({_id: params.id}, {images: {_id: 1}});   
    const serializedTotal = JSON.parse(JSON.stringify(total)).images.length


    //previously got imageSet here but want to paginate
    // const imageSet = await ImageSet.findOne({_id: params.id}, {images: {$slice: [0, 19]}}).lean()  //great but doesn't return total number of images
    // imageSet._id = imageSet._id.toString()
    // const serializedImageSet = JSON.parse(JSON.stringify(imageSet)) 
    
    // return { props: { user, imageSet: serializedImageSet, total:serializedTotal } }

    return { props: { user, total:serializedTotal }}
  }
})