import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import ImageSetForm from "@/components/ImageSetForm";

const NewImageSetPage = ({user}) => {

    const imageSetForm = {
        name: ''
    }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-4xl">New image set</h1>
    
    
    <ImageSetForm formId="add-image-set-form" imageSetForm={imageSetForm} />
   
  </div>

</>

    );

}

export default NewImageSetPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
     
  
    return { props: { user } }
  }
})