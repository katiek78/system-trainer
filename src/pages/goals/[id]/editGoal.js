import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router"
import useSWR from 'swr'
import dbConnect from "@/lib/dbConnect";
// import Goal from "@/models/Goal";
import GoalForm from "@/components/GoalForm"

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data)


const EditGoal = ({user}) => {
        
    const router = useRouter()
    const { id } = router.query
    const {
      data: goal,
      error,
      isLoading,
    } = useSWR(id ? `/api/goals/${id}` : null, fetcher)
  
    if (error) return <p>Failed to load</p>
    if (isLoading) return <p>Loading...</p>
    if (!goal) return null  

    //goal is returned correctly
   
    const goalForm = {
        startDate: goal.startDate,
        endDate: goal.endDate,    
        discipline: goal.discipline,
        score: goal.score,        
        time: goal.time || '',        
      }

  return (
    <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">Edit goal</h1>
  <GoalForm userId={user.sub} formId="edit-goal-form" forNewEntry={false} goalForm={goalForm} />
  </div>
  </>
  )
}

export default EditGoal;

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect()

              
    return { props: { user } }
  }
})