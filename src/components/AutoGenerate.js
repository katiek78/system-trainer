import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'

const AutoGenerate = ({ formId, doesPlanExist, autoGenerateForm, onCancelClick, onGenerate }) => {
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);
  const [mlSelected, setMLSelected] = useState(false);
  const [traditionalSelected, setTraditionalSelected] = useState(false);
  const [iamImagesSelected, setIAMImagesSelected] = useState(false);
  const [abstractImagesSelected, setAbstractImagesSelected] = useState(false);

  const handleCheckboxChange = (e) => {   
    setForm({
        ...form,
        [e.target.name]: e.target.checked
     })
  };

//   const handleTraditionalCheckboxChange = (e) => {
//     setTraditionalSelected(e.target.checked);
//   };

//   const handleIAMImagesChange = (e) => {
//     setIAMImagesSelected(e.target.checked);
//   };

//   const handleAbstractImagesChange = (e) => {
//     setAbstractImagesSelected(e.target.checked);
//   };
  
  const [form, setForm] = useState({
    minutes: autoGenerateForm.minutes || 30,  
    ML: autoGenerateForm.ML,
    traditional: autoGenerateForm.traditional,
    IAMImages: autoGenerateForm.IAMImages,
    AI: autoGenerateForm.AI
  })
  
  const handleCancel = () => {
    onCancelClick(); // Call the onCancelClick function passed from the parent component
  };


  const handleChange = (e) => {
    const target = e.target
    const value = target.value
    const name = target.name

    setForm({
      ...form,
      [name]: value,
    })
  }

  /* Makes sure log entry info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.minutes) err.minutes = 'Number of training minutes is required'
   
    return err
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    //If user has entered < 5 minutes, alert them and don't continue
    if (form.minutes < 5) {
        alert("You have not chosen enough minutes to do any training.")
        return;
    }

    //If user has not checked either ML or traditional, alert them and don't continue
    if (!form.ML && !form.traditional) {
        alert("Please choose Memory League or traditional disciplines, or both.")
        return;
    }

    //Check if user is happy overwriting existing plan
    const confirmed = !doesPlanExist || window.confirm('This will overwrite your existing training plan. Are you sure?');
 
    //Proceed to generate plan
    if (confirmed) {
            setAlreadyGenerated(true);
            onGenerate(form);
    }


    // const errs = formValidate()
    // if (Object.keys(errs).length === 0) {
    //   forNewEntry ? postData(form) : putData(form)
    // } else {
    //   setErrors({ errs })
    // }
  }

  return (
    <>
      <form className ="rounded pt-6 pb-8 mb-4" id={formId} onSubmit={handleSubmit}>
      <label htmlFor="name">How many minutes do you plan to train per day?</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"       
          name="minutes"
          value={form.minutes}
          onChange={handleChange}
          required          
        />

        <div>
        <label>
          <input
            type="checkbox"
            name="ML"
            checked={form.ML}
            onChange={handleCheckboxChange}
            className="mr-3"
          />
          Memory League
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="traditional"
            checked={form.traditional}
            onChange={handleCheckboxChange}
            className="mr-3"
          />
          Traditional Disciplines
        </label>

        {form.traditional && (
          <div>
            <label>
              <input
                type="checkbox"
                checked={form.IAMImages}
                name="IAMImages"
                onChange={handleCheckboxChange}
                className="mr-3"
              />
              IAM Images
            </label>

            <label>
              <input
                type="checkbox"
                name="AI"
                checked={form.AI}
                onChange={handleCheckboxChange}
                className="mr-3 ml-12"
              />
              Abstract Images
            </label>
          </div>
        )}
      </div>
     
        <br />
        <button type="submit" className="btn bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-700 hover:to-blue-700 text-white font-bold mt-3 mr-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          {alreadyGenerated ? <>Re-generate!</> : <>Generate my plan!</>}
        </button>
        <button onClick={handleCancel} type="button" className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Cancel
        </button>

      </form>
      <p>{message}</p>
      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>
    </>
  )
}

export default AutoGenerate;

