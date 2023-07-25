import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from "react";
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEdit, faGrip, faList } from "@fortawesome/free-solid-svg-icons";
import { refreshData } from "@/lib/refreshData";

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
        images: imageSet.images      
      })
    const [populateForm, setPopulateForm] = useState({     
      setType: 'other'      
    })

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
         //get the array that we want to populate the image set with
        let imageArray = [];
        switch(populateForm.setType) {
            case '2d':
                for (let i = 0; i < 100; i++) {
                    const twoDigitValue = i.toString().padStart(2, '0');
                    imageArray.push({ name: twoDigitValue });
                }
                break;
            case '3d':
                for (let i = 0; i < 1000; i++) {
                    const threeDigitValue = i.toString().padStart(3, '0');
                    imageArray.push({ name: threeDigitValue });
                    }
                break;
            case '4d':
                for (let i = 0; i < 10000; i++) {
                    const fourDigitValue = i.toString().padStart(4, '0');
                    imageArray.push({ name: fourDigitValue });
                    }
                break;
            case 'other':
            default:
        }

        console.log(imageArray);
        const { id } = router.query
        console.log(id);
        try {
          setImageForm({images: imageArray})
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
         console.log(JSON.stringify({...imageSet, images: imageForm.images}))
         const res = await fetch(`/api/imageSets/${id}`, {
           method: 'PUT',
           headers: {
             Accept: contentType,
             'Content-Type': contentType,
           },
           body: JSON.stringify({...imageSet, images: imageForm.images}),
         })
   
         // Throw error with status code in case Fetch API req failed
         if (!res.ok) {
           throw new Error(res.status)
         }
   
         const { data } = await res.json()
   
         mutate(`/api/imageSets/${id}`, data, false) // Update the local data without a revalidation
         refreshData(router);
       } catch (error) {
         setMessage('Failed to update images')
       }
     }
    

      const handleChangeImageForm = (e) => {
        const target = e.target     
        const value = target.value
        const name = target.name
       
        const updatedForm = { ...imageForm };
        const thisIndex = name.slice(8);        
        updatedForm.images[thisIndex].imageItem = value;
        //     } else if (isWordType) {                      
        //       updatedForm.words[wordIndex].wordType = value;
        //     } else  updatedForm.words[wordIndex].meaning = value;
        //   }
        console.log(updatedForm);
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
    }

    const handleToggleListView = () => {
        setIsListView(!isListView);
    }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{imageSet.name}</h1> 
    <div className="flex flex-row">
        <div className="basis-1/3">
        {isEditable ? 
        <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleSubmitImageForm} icon={faCheck} size="3x" />
        : <FontAwesomeIcon className="hover:text-gray-700 hover:cursor-pointer" onClick={handleToggleEditable} icon={faEdit} size="3x" />
        }
        </div>

        <div className="flex flex-row basis-2/3">        
            <div>
            <FontAwesomeIcon className={isListView ? "text-black " : "text-white hover:text-gray-700 hover:cursor-pointer"} onClick={handleToggleListView} icon={faList} size="3x" />
            </div>
            <div className="ml-4">
            <FontAwesomeIcon className={isListView || isEditable ? "text-white hover:text-gray-700 hover:cursor-pointer" : "text-black"} onClick={handleToggleListView} icon={faGrip} size="3x" />        
            </div>
        </div>
    </div>
   
    <div>{renderPageNumbers()}</div>
    <div className="mt-3 w-full grid grid-cols-2 gap-y-1">
    {imageSet.images.filter((img, i) => i < currentPage*pageLimit && i >= (currentPage - 1)*pageLimit).map((img,i) => {
        if (isEditable) {
            return <><div className="col-span-1">{img.name}</div><div className="col-span-1"><input onChange={handleChangeImageForm} value={img.imageItem && img.imageItem.length > 0 ? img.imageItem : ""} id={'inpImage' + (i + (currentPage-1)*pageLimit)} name={'inpImage' + (i + (currentPage-1) * pageLimit)}></input></div></>
        } else return <><div className="col-span-1">{img.name}</div><div className="col-span-1">{img.imageItem || '<none entered>'}</div></>
      })
    }
    
    </div>
   
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

    {/* Display select box with possible types and a button Populate Set */}
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