import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router"
import useSWR from 'swr'
import dbConnect from "@/lib/dbConnect";
import PlanEntryForm from "@/components/PlanEntryForm"

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data)


const EditPlanEntry = ({user}) => {
        
    const router = useRouter()
    const { id } = router.query
    const {
      data: entry,
      error,
      isLoading,
    } = useSWR(id ? `/api/planEntries/${id}` : null, fetcher)
  
    if (error) return <p>Failed to load</p>
    if (isLoading) return <p>Loading...</p>
    if (!entry) return null  

    //entry is returned correctly
   
    const planEntryForm = {       
        discipline: entry.discipline,
        frequency: entry.frequency,
        frequencyType: entry.frequencyType,
        frequencySpecifics: entry.frequencySpecifics,       
      }

 
  

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Edit entry</h1>
  <PlanEntryForm userId={user.sub} formId="edit-plan-entry-form" forNewEntry={false} planEntryForm={planEntryForm} />
  </div>
  </>
  )
}

export default EditPlanEntry;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect()

     
    return { props: { user } }
  }
})