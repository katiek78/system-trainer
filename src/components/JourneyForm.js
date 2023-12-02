import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'

const JourneyForm = ({ userId, formId, journeyForm, forNewJourney = true }) => {
  const router = useRouter()
  const contentType = 'application/json'
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: journeyForm.name,
  })

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const { id } = router.query
    const { ...formDataToStore } = form;

    try {
      const res = await fetch(`/api/journeys/${id}`, {
        method: 'PUT',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify(formDataToStore),
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }

      const { data } = await res.json()

      mutate(`/api/journeys/${id}`, data, false) // Update the local data without a revalidation
      router.push({pathname: `/journeys/${id}`})
    } catch (error) {
      setMessage('Failed to update journey')
    }
  }

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    //populate set
    
    const { ...formDataToStore } = form;


    try {
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
        body: JSON.stringify({...formDataToStore, userId: userId}),        
      })

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status)
      }

      router.push({pathname: `/journeys`})
    } catch (error) {
      setMessage('Failed to add journey')
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

  /* Makes sure journey info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.name) err.name = 'Name is required'
   
    return err
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const errs = formValidate()
    if (Object.keys(errs).length === 0) {
      forNewJourney ? postData(form) : putData(form)
    } else {
      setErrors({ errs })
    }
  }

  return (
    <>
      <form className ="rounded pt-6 pb-8 mb-4" id={formId} onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input className="shadow appearance-none border rounded w-full mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="60"
          name="name"
          value={form.name}
          onChange={handleChange}
          required          
        />

<br />

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

export default JourneyForm
