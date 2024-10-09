import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'
import { ML_DISCIPLINES } from '@/lib/disciplines'; 
import { TRADITIONAL_DISCIPLINES } from '@/lib/disciplines'; 
import { getTodayDate, formatDate } from "@/utilities/day";

// import { getPopulatedImageArray } from '@/lib/getPopulatedImageArray'
// import { getPopulatedPhoneticsArray } from '@/lib/getPopulatedPhoneticsArray'



const LogEntryForm = ({ userId, journeys, publicJourneys, formId, logEntryForm, forNewEntry = true,  }) => {
  const router = useRouter()
  const contentType = 'application/json'
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')


  const sortedJourneys = journeys.sort((a, b) => a.name.localeCompare(b.name));
  const sortedPublicJourneys = publicJourneys.sort((a, b) => a.name.localeCompare(b.name));


  const [form, setForm] = useState({
    entryDate: forNewEntry ? getTodayDate() : formatDate(logEntryForm.entryDate),    
    discipline: logEntryForm.discipline || ML_DISCIPLINES[0],
    score: logEntryForm.score,
    correct: logEntryForm.correct,
    time: logEntryForm.time || '',
    journey: logEntryForm.journey || (journeys ? sortedJourneys[0]._id : ''),
    notes: logEntryForm.notes,
  })



  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const { id } = router.query
    // const { setType, ...formDataToStore } = form;

    try {
      const res = await fetch(`/api/logEntries/${id}`, {
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

      mutate(`/api/logEntries/${id}`, data, false) // Update the local data without a revalidation
      router.push({pathname: `/log`})
    } catch (error) {
      setMessage('Failed to update log entry')
    }
  }

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
   
    try {
      const res = await fetch('/api/logEntries', {
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

      router.push({pathname: `/log`})
    } catch (error) {
      setMessage('Failed to add log entry')
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

  /* Makes sure log entry info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.entryDate) err.entryDate = 'Date is required'
   
    return err
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
      <label htmlFor="name">Date</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="date"       
          name="entryDate"
          value={form.entryDate}
          onChange={handleChange}
          required          
        />

        <label htmlFor="discipline">Discipline</label>
        <select className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="discipline"
        //  value={form.discipline || 'other'}
          value={form.discipline || ML_DISCIPLINES[0]}
          onChange={handleChange}          
          required
                >
                {ML_DISCIPLINES.map(d => <option value={d}>{d}</option>)}
                {TRADITIONAL_DISCIPLINES.map(d => <option value={d}>{d}</option>)}
        <option value="other">other</option>
        </select> 

        <label htmlFor="score">Score</label>
        <input className="shadow appearance-none border rounded w-20 ml-3 mr-10 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="10"
          name="score"
          value={form.score}
          onChange={handleChange}               
        />

 {/* ONLY SHOW IF WE SELECTED A TRADITIONAL DISCIPLINE */}
 {TRADITIONAL_DISCIPLINES.includes(form.discipline) &&
        <>
        <label htmlFor="correct">Correct</label>
        <input className="shadow appearance-none border rounded w-20 ml-3 mr-10 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="10"
          name="correct"
          value={form.correct}
          onChange={handleChange}               
        />
        </>
        }


  {/* ONLY SHOW IF WE SELECTED AN ML DISCIPLINE OR SPEED CARDS */}
  {(ML_DISCIPLINES.includes(form.discipline)  || form.discipline === 'Speed Cards') &&
        <>
       
        <label htmlFor="time">Time (s)</label>
        <input className="shadow appearance-none border rounded w-20 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="10"
          name="time"
          value={form.time}
          onChange={handleChange}               
        /> 
        </>
  }

       <br />
        <label htmlFor="journey">Journey</label>
        <select className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="journey"
          value={form.journey ||  (journeys ? sortedJourneys[0]._id : '')}
          onChange={handleChange}          
          required
                >
                {journeys && sortedJourneys.map(j => <option value={j._id}>{j.name}</option>)}            
                {publicJourneys && sortedPublicJourneys.map(j => <option value={j._id}>{j.name}</option>)}            
        <option value="no">no journey used</option>
        <option value="other">other</option>
        </select> 



<br /><br />
        <label htmlFor="notes">Notes</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="60"
          name="notes"
          value={form.notes}
          onChange={handleChange}               
        />

      
{/* <br />
{form.setType !== "other" &&  
<>
<label htmlFor="phoneticsType">Select phonetics if applicable:</label>
        <select         
          name="phoneticsType"
          value={form.phoneticsType || 'none'}
          onChange={handleChange}
          className="ml-3"
          required
                >
        <option value="none">None</option>
        {form.setType !== "1c" && <option value="maj">Major System</option> }               
        {(form.setType === "2c" || form.setType === "2cv" ||form.setType === "3d") &&  <option value="ben">Ben System</option> }              
        {(form.setType === "2c" || form.setType === "2cv" ||form.setType === "4d") &&  <option value="kben">Katie Ben System</option> }
        </select>
        </>
      } */}
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

export default LogEntryForm;

