import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import JourneyForm from "@/components/JourneyForm";

const NewJourneyPage = ({user}) => {

    const journeyForm = {
        name: ''
    }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New journey</h1>
    
    
    <JourneyForm userId={user.sub} formId="add-journey-form" journeyForm={journeyForm} />
   
  </div>

</>

    );

}

export default NewJourneyPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
     
  
    return { props: { user } }
  }
})