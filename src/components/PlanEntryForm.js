import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'
import { ML_DISCIPLINES } from '@/lib/disciplines'; 
import { TRADITIONAL_DISCIPLINES } from '@/lib/disciplines'; 


const PlanEntryForm = ({ userId, formId, planEntryForm, forNewEntry = true,  }) => {
  const router = useRouter()
  const contentType = 'application/json'
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({   
    discipline: planEntryForm.discipline || ML_DISCIPLINES[0],
    frequency: planEntryForm.frequency,
    frequencyType: planEntryForm.frequencyType,
    frequencySpecifics: planEntryForm.frequencySpecifics,    
  })


  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const { id } = router.query
    // const { setType, ...formDataToStore } = form;

    try {
      const res = await fetch(`/api/planEntries/${id}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(form),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }

      const { data } = await res.json()

      mutate(`/api/planEntries/${id}`, data, false) // Update the local data without a revalidation
      router.push({pathname: `/plan`})
    } catch (error) {
      setMessage('Failed to update plan entry')
    }
  }

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
   
    try {
      const res = await fetch('/api/planEntries', {
        method: 'POST',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify({...form, userId: userId}),        
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }

      router.push({pathname: `/plan`})
    } catch (error) {
      setMessage('Failed to add plan entry')
    }
  }


  const handleChange = (e) => {
    const target = e.target
    const value = target.value
    const name = target.name

    setForm({
      ...form,
      [name]: value,
    })
  }

  /* Makes sure plan entry info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.discipline) err.discipline = 'Discipline is required'
   
    return err
  }

  const handleAddSpecifics = (e) => {
    const specificsString = e.target.value;
    alert(specificsString)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const errs = formValidate()
    if (Object.keys(errs).length === 0) {
      forNewEntry ? postData(form) : putData(form)
    } else {
      setErrors({ errs })
    }
  }

  return (
    <>
      <form className ="rounded pt-6 pb-8 mb-4" id={formId} onSubmit={handleSubmit}>
      
        <label htmlFor="discipline">Discipline</label>
        <select className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="discipline"      
          value={form.discipline || ML_DISCIPLINES[0]}
          onChange={handleChange}          
          required
                >
                {ML_DISCIPLINES.map(d => <option value={d}>{d}</option>)}
                {TRADITIONAL_DISCIPLINES.map(d => <option value={d}>{d}</option>)}
        <option value="other">other</option>
        </select> 

        <label htmlFor="frequency">Frequency</label>
        <input className="shadow appearance-none border rounded w-14 ml-3 mr-1 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="4"
          name="frequency"
          value={form.frequency}
          onChange={handleChange}               
        /> times per 
        <select className="shadow appearance-none border rounded w-20 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="frequencyType"      
          value={form.frequencyType}
          onChange={handleChange}          
          required
                >             
        <option value="D">day</option>
        <option value="W">week</option>
        <option value="M">month</option>
        </select> 

{form.frequencyType !== 'D' &&
<>
       <br />
        <label htmlFor="frequencySpecifics">Which days do you want to do this?</label>        
        <input className="shadow appearance-none border rounded w-20 ml-3 mr-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="50"
          name="frequencySpecifics"
          value={form.frequencySpecifics}
          onChange={handleChange}               
        /> <button type="button" onClick={handleAddSpecifics} className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Add</button>
        </>
}

        <br />
        <button type="submit" className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Submit
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

export default PlanEntryForm;

