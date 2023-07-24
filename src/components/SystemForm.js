import { useState } from 'react'
import { useRouter } from 'next/router'
import { mutate } from 'swr'

const SystemForm = ({ formId, systemForm, forNewSystem = true }) => {
  const router = useRouter()
  const contentType = 'application/json'
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    name: systemForm.name,
    // meaning: wordForm.meaning,
    // wordType: wordForm.wordType
  })

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form) => {
    const { id } = router.query

    try {
      const res = await fetch(`/api/systems/${id}`, {
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

      mutate(`/api/systems/${id}`, data, false) // Update the local data without a revalidation
      router.push({pathname: '/'})
    } catch (error) {
      setMessage('Failed to update system')
    }
  }

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    try {
      const res = await fetch('/api/systems', {
        method: 'POST',
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

      router.push('/')
    } catch (error) {
      setMessage('Failed to add system')
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

  /* Makes sure system info is filled */
  const formValidate = () => {
    let err = {}
    if (!form.name) err.name = 'Name is required'
   
    return err
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const errs = formValidate()
    if (Object.keys(errs).length === 0) {
      forNewSystem ? postData(form) : putData(form)
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

        {/* <label htmlFor="meaning">Meaning</label>
        <input
          type="text"
          maxLength="100"
          name="meaning"
          value={form.meaning}
          onChange={handleChange}
          required
        />

        <label htmlFor="wordType">Word type</label>
        <select         
          name="wordType"
          value={form.wordType || 'adjective'}
          onChange={handleChange}
          required
                >
        <option value="adjective">adjective</option>
        <option value="adverb">adverb</option>        
        <option value="noun">noun</option>
        <option value="verb">verb</option>
        <option value="multiple">multiple</option>
        <option value="other">other</option>
        </select> */}

        <button type="submit" className="btn bg-black hover:bg-gray-700 text-white font-bold py-1 px-4 rounded focus:outline-none focus:shadow-outline">
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

export default SystemForm
