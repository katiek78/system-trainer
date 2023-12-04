import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import PlanEntryForm from "@/components/PlanEntryForm";

const NewPlanEntryPage = ({user}) => {

    const planEntryForm = {
        discipline: '',
        frequency: '',
        frequencySpecifics: []
    }


    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New training plan entry</h1>
    
    
    <PlanEntryForm userId={user.sub} formId="add-plan-entry-form" planEntryForm={planEntryForm} />
   
  </div>

</>

    );

}

export default NewPlanEntryPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    const db = await dbConnect()                 
  
    return { props: { user } }
  }
})