import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from "react";
import { mutate } from 'swr'
import { useRouter } from 'next/router'
import dbConnect from "@/lib/dbConnect";
import ImageSet from "@/models/ImageSet";
import Link from "next/link";
import { refreshData } from "@/lib/refreshData";

const ImageSetPage = ({user, imageSet}) => {
    const router = useRouter()
    const contentType = 'application/json'
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState('')
  
    const [populateForm, setPopulateForm] = useState({     
      setType: 'other'      
    })


    const putData = async (populateForm) => {
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
          console.log(JSON.stringify({...imageSet, images: imageArray}))
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
    


  const putDataOLD = async (populateForm) => {
    //get the array that we want to populate the image set with
    let imageArray = [];
    console.log(populateForm.setType)
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

    try {
      const res = await fetch(`/api/imageSets/${imageSet._id}`, {  
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

      router.push({pathname: `/imageSet/${imageSet._id}`})
    } catch (error) {
      setMessage('Failed to add images to set')
    }
  }

  const handleChange = (e) => {
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

    const handleSubmit = (e) => {
        e.preventDefault()
        
        putData(populateForm)
       
      }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{imageSet.name}</h1>
   
    {imageSet.images.length > 0 && imageSet.images.map(img =>
    <p>{img.name} {img.imageItem}</p>) 
    }
   
    {imageSet.images.length === 0 && 
    <>
    <p>You have not added any images to this set. <br />
    Add some images manually, or select the set type and then click Populate Set to add the images automatically (e.g. 000-999 for a 3-digit set). </p>
    
    <form className ="rounded pt-6 pb-8 mb-4" id="populate-set-form" onSubmit={handleSubmit}>
        
        <label htmlFor="setType">What type of set is this?</label>
        <select         
          name="setType"
          value={populateForm.setType || 'other'}
          onChange={handleChange}
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