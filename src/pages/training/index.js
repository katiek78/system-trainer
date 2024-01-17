
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import dbConnect from "@/lib/dbConnect";
import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from '@/lib/disciplines'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

const TrainingPage = ({ user }) => {
  const [errors, setErrors] = useState({})
  
    return (
        <>
            <div className="z-10 justify-between font-mono text-lg max-w-5xl">
                <h1 className="py-2 font-mono text-4xl">Training Centre</h1>

                <br />
                <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
                    <h3 className="font-semibold">Do some training or drills</h3>
                    <p className="font-mono">Select your discipline and see all the training options.</p>
                </div>
            

            </div>
        </>
    )
}

export default TrainingPage;

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

