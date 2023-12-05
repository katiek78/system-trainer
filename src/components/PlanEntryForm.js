import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'
import { ML_DISCIPLINES } from '@/lib/disciplines'; 
import { TRADITIONAL_DISCIPLINES } from '@/lib/disciplines'; 
import FrequencySpecific from "./FrequencySpecific";

const PlanEntryForm = ({ userId, formId, planEntryForm, forNewEntry = true,  }) => {
  const router = useRouter()
  const contentType = 'application/json'
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({   
    discipline: planEntryForm.discipline || ML_DISCIPLINES[0],
    frequency: planEntryForm.frequency,
    frequencyType: planEntryForm.frequencyType || 'D',
    frequencySpecifics: planEntryForm.frequencySpecifics,  
    frequencySpecificsInput: ''  
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

    let resetFrequencySpecifics = false;

    if ((value === 'W' || value === 'M' || value === 'D') && form.frequencyType !== value) {
        resetFrequencySpecifics = true;
    }

    setForm({
      ...form,
      [name]: value,
      frequencySpecifics: resetFrequencySpecifics ? [] : form.frequencySpecifics
    })
  }

  /* Makes sure plan entry info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.discipline) err.discipline = 'Discipline is required'
   
    return err
  }

  const weekdaysOrder = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

  const mapDayAbbreviation = (input) => {

    const dayAbbreviations = {
      'm': 'M', 'mo': 'M', 'mon': 'M', 'monday': 'M',
      'tu': 'Tu', 'tue': 'Tu', 'tues': 'Tu', 'tuesday': 'Tu',
      'w': 'W', 'we': 'W', 'wed': 'W', 'wednesday': 'W',
      'th': 'Th', 'thu': 'Th', 'thur': 'Th', 'thurs': 'Th', 'thursday': 'Th',
      'f': 'F', 'fr': 'F', 'fri': 'F', 'friday': 'F',
      'sa': 'Sa', 'sat': 'Sa', 'saturday': 'Sa',
      'su': 'Su', 'sun': 'Su', 'sunday': 'Su'
    };

  const lowerInput = input.toLowerCase(); // Convert input to lowercase for case-insensitive comparison
  const abbreviation = dayAbbreviations[lowerInput];

  return abbreviation || null; // Return abbreviation if found, otherwise return the original input
};

function convertToNumeric(input) {
           
    const numericValue = parseInt(input, 10); // Attempt to parse the input as a number
  
    if (!isNaN(numericValue)) {
      return numericValue; // If the input is already a valid number, return it
    }
  
    const stripped = input.replace(/(st|nd|rd|th)$/i, ''); // Remove ordinal suffixes
    const numeric = parseInt(stripped, 10); // Parse the modified string as a number
  
    return isNaN(numeric) ? input : numeric; // Return the numeric value or the original input
  }


const handleAddSpecifics = () => {
 
        const specificsString = form.frequencySpecificsInput.trim();
        const specificsArray = specificsString.split(/[, ]+/);
      
        const validatedEntries = specificsArray.flatMap(entry => {
          const lowerEntry = entry.toLowerCase();
      
          if (form.frequencyType === 'W') {
            // If the frequency type allows only days of the week
            const mappedEntry = mapDayAbbreviation(lowerEntry);
            //console.log(mappedEntry || []) //logs []
            return mappedEntry !== null ? [mappedEntry] : [];
          } else if (form.frequencyType === 'M') {
            // If the frequency type allows only days of the month
            const numericEntry = convertToNumeric(entry);
            return !isNaN(numericEntry) && numericEntry >= 1 && numericEntry <= 31 ? [numericEntry] : [];
          }
      
          // Default case: allow all entries if frequencyType is neither 'W' nor 'M'
          return [];
        });
      
  
    // Update the form and clear input
    console.log(validatedEntries) //it's [null]
    if (validatedEntries.length === 0) {
      setForm({
        ...form,
        frequencySpecificsInput: '',
      });
    } else {
      setForm({
        ...form,
        frequencySpecificsInput: '',
        frequencySpecifics: [...form.frequencySpecifics, ...validatedEntries].sort(),
      });
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const errs = formValidate()
    if (Object.keys(errs).length === 0) {
      forNewEntry ? postData(form) : putData(form)
    } else {
      setErrors({ errs })
    }
  }

  const handleRemoveDay = (dayToRemove) => {
    const index = form.frequencySpecifics.indexOf(dayToRemove);
    if (index !== -1) {
      const updatedSpecifics = [...form.frequencySpecifics];
      updatedSpecifics.splice(index, 1);
      setForm({ ...form, frequencySpecifics: updatedSpecifics });
    }
  };

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
        <label htmlFor="frequencySpecificsInput">Which days do you want to do this?</label>        
        <input className="shadow appearance-none border rounded w-20 ml-3 mr-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="50"
          name="frequencySpecificsInput"
          value={form.frequencySpecificsInput}
          onChange={handleChange}               
        /> <button type="button" onClick={handleAddSpecifics} className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">Add</button>
        <div className="flex gap-4">{form.frequencySpecifics
            .sort((a, b) => weekdaysOrder.indexOf(a) - weekdaysOrder.indexOf(b))
            .map((el, index) => <FrequencySpecific key={index} day={el} onRemoveDay={handleRemoveDay} />)}</div>
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

