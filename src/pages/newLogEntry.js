import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import LogEntryForm from "@/components/LogEntryForm";

const NewLogEntryPage = ({user}) => {

    const logEntryForm = {
        notes: ''
    }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New training log entry</h1>
    
    
    <LogEntryForm userId={user.sub} formId="add-log-entry-form" logEntryForm={logEntryForm} />
   
  </div>

</>

    );

}

export default NewLogEntryPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
     
  
    return { props: { user } }
  }
})