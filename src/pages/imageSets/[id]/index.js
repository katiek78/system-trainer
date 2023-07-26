import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState } from "react";
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEdit, faGrip, faList } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";
import { getPopulatedImageArray } from "@/lib/getPopulatedImageArray";

const ImageSetPage = ({user, imageSet}) => {
    const router = useRouter()    
    const contentType = 'application/json'

    const [currentPage, setCurrentPage] = useState(1);
    const pageLimit = 20;
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState('')
    const [isListView, setIsListView] = useState(true);
    const [isEditable, setIsEditable] = useState(false);
  
    const [imageForm, setImageForm] = useState({      
        name: imageSet.name,       
        images: imageSet.images      
      })
    const [populateForm, setPopulateForm] = useState({     
      setType: 'other'      
    })
    const [title, setTitle] = useState(imageSet.name)

    const renderPageNumbers = () => {   
        let div = [];
        for (let i = 0; i < imageSet.images.length / pageLimit; i++) {        
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
        
       const { id } = router.query
      
       try {
         
         const res = await fetch(`/api/imageSets/${id}`, {
           method: 'PUT',
           headers: {
             Accept: contentType,
             'Content-Type': contentType,
           },
           body: JSON.stringify({...imageSet, name: imageForm.name, images: imageForm.images}),
         })
   
         // Throw error with status code in case Fetch API req failed
         if (!res.ok) {
           throw new Error(res.status)
         }
   
         const { data } = await res.json()
   
   //      mutate(`/api/imageSets/${id}`, data, false) // Update the local data without a revalidation
     //    refreshData(router);
         console.log(imageSet);
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
            thisIndex = name.slice(6);
            updatedForm.images[thisIndex].URL = value;
        } else {
            thisIndex = name.slice(8);
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

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{isEditable ? <input onChange={handleChangeTitle} className='text-4xl' size='50' value={imageForm.name}></input> : imageForm.name}</h1> 
    <div className="flex flex-row">
        <div className="basis-1/3">
        {isEditable ? 
        <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleSubmitImageForm} icon={faCheck} size="3x" />
        : <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleToggleEditable} icon={faEdit} size="3x" />
        }
        </div>

        <div className={isEditable ? "invisible flex flex-row basis-2/3" : "flex flex-row basis-2/3"}>        
            <div className="">
            <FontAwesomeIcon className={isListView ? "px-3 rounded bg-white text-black text-6xl" : "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer"} onClick={handleToggleListView} icon={faList} size="3x" />
            </div>
            <div className="ml-2">
            <FontAwesomeIcon className={isListView ? "px-3 text-gray-100 hover:text-gray-700 hover:cursor-pointer" : "px-3 rounded bg-white text-black text-6xl"} onClick={handleToggleListView} icon={faGrip} size="3x" />        
            </div>
        </div>
    </div>
   
    <div>{renderPageNumbers()}</div>

    {isListView &&
    <div className="mt-3 w-full grid grid-cols-3 gap-y-10">
    {imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img,i) => {
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
    {imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img) => (
      <>

      <div class="group [perspective:1000px]">
    <div class="relative m-2 h-40 w-60 rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
      <div class="absolute inset-0 rounded-xl border-4 border-slate-700 bg-white">
      <div class="flex-col rounded-xl px-12  text-center text-black absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <h1 class="text-3xl font-bold">{img.name}</h1>         
        </div> 
      </div>
      <div class="absolute inset-0 h-full w-full  rounded-xl  [transform:rotateY(180deg)] [backface-visibility:hidden]">
         <div class="flex-col rounded-xl bg-black/60 px-12  text-center text-slate-200 absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <h1 class="text-3xl font-bold">{img.imageItem}</h1>         
        </div> 
        <img class="h-full w-full rounded-xl object-cover shadow-xl shadow-black/40" src={img.URL && img.URL.length > 0 ? img.URL : "https://images.unsplash.com/photo-1689910707971-05202a536ee7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDE0fDZzTVZqVExTa2VRfHxlbnwwfHx8fHw%3D&auto=format&fit=crop&w=500&q=60')"} alt="" />
      </div>
    </div>
  </div>
     
 </>
    ))}
    </div>

    
    
    }

    {imageSet.images.length === 0 && 
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
  
    const imageSet = await ImageSet.findById(params.id).lean()
    imageSet._id = imageSet._id.toString()
    const serializedImageSet = JSON.parse(JSON.stringify(imageSet))

    // const result = await ImageSet.find({})
    // const imageSets = result.map((doc) => {   
    // const imageSet = JSON.parse(JSON.stringify(doc));
    // imageSet._id = imageSet._id.toString()
    // return imageSet
    // })
  
    return { props: { user, imageSet: serializedImageSet } }
  }
})