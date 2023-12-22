
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Link from "next/link";
import { refreshData } from "@/lib/refreshData";
import { useState } from "react";
import { useRouter } from "next/router";
import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from '@/lib/disciplines'; 


const TimingPage = ({ user }) => {
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({   
    discipline: ML_DISCIPLINES[0],    
    time: '',
    grouping: '',
    grabData: '',
    grabTime: ''
  })
  const [bpm, setBpm] = useState(null);

  const getUnits = (discipline) => {
    // Split the input string into words
  const words = discipline.trim().split(/\s+/);
  
  // Check if there are at least two words in the input
  if (words.length >= 2) {
    // Return the second word converted to lowercase
    return words[words.length - 1].toLowerCase();
  } else {
    // If there's no second word, return an empty string or handle it as needed
    return words[0].toLowerCase();
  }
  }

  const handleCalculate = () => {
    if (form.time === '') {
      alert("You need to enter your target time.")
      return;
    }
    const requiredBPM = getRequiredBPM(form.discipline, form.grouping, form.grabData, form.grabTime, form.time)
    setBpm(requiredBPM);
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


    return (
        <>
            <div className="z-10 justify-between font-mono text-lg max-w-5xl">
                <h1 className="py-2 font-mono text-4xl">Calculate timing</h1>

                <br />
                <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                    <h3 className="font-semibold">Calculate the BPM for your target time</h3>
                    <p className="font-mono">Select your discipline, target time and a couple of other details and you'll be given a BPM. You can even find songs that match the BPM to help you get a feel for the timing.</p>
                </div>
            

            </div>
            <br />
            <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
            <form>
  

 I want to achieve a time of 

  
        <input className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="7"
          name="time"
          value={form.time}
          onChange={handleChange}               
        />  seconds&nbsp;
     
        in:
        <select className="shadow appearance-none border rounded w-full mt-1 mx-3 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"       
          name="discipline"      
          value={form.discipline || ML_DISCIPLINES[0]}
          onChange={handleChange}          
          required
                >
                {ML_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}                
        </select> 

        with a grouping of:
        <input className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="2"
          name="grouping"
          value={form.grouping}
          onChange={handleChange}               
        />  {getUnits(form.discipline)}  &nbsp;

        and grabbing:
        <input className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="2"
          name="grabData"
          value={form.grabData}
          onChange={handleChange}               
        />  {getUnits(form.discipline)}  &nbsp; in:


 <input className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          maxLength="2"
          name="grabTime"
          value={form.grabTime}
          onChange={handleChange}               
        /> seconds &nbsp;
  
        <br />
        <button type="button" onClick={handleCalculate} className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
          Calculate
        </button>


        {bpm &&
        <p className="mt-5 text-5xl">Your required BPM is: {bpm.join(" / ")}</p>
        }

      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>   
          </form>

            </div>
        

    
        </>
    )
}

export default TimingPage;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
     const db = await dbConnect()
     const user = (auth0User).user

      // Function to fetch log entries with pagination
 

    
    return {
      props: { 
        user,
           
      },
    };
  },
})

