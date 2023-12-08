import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import GoalForm from "@/components/GoalForm";

const NewGoalPage = ({user}) => {

    const goalForm = {       
        startDate: '',
        endDate: '',
        discipline: '',
        score: 0,
        time: 0,
        achieved: false
    }


    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New training goal</h1>
    
    
    <GoalForm userId={user.sub} formId="add-goal-form" goalForm={goalForm} />
   
  </div>

</>

    );

}

export default NewGoalPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect()                 
  
    return { props: { user } }
  }
})