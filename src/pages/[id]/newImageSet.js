import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import MemoSystem from "@/models/MemoSystem";
import ImageSetForm from "@/components/ImageSetForm";

const SystemPage = ({user, system}) => {

    const imageSetForm = {
        name: ''
    }

    return(
 <>
    <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
    <h1 className="py-2 font-mono text-5xl">{system.name}</h1>
    
    <p className="text-3xl">Add an image set</p>
    
    
    <ImageSetForm formId="add-image-set-form" imageSetForm={imageSetForm} />
   
  </div>

</>


    );

}

export default SystemPage

export const getServerSideProps = withPageAuthRequired({
    getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect()
  
    const system = await MemoSystem.findById(params.id).lean()
    system._id = system._id.toString()
  
    return { props: { user, system } }
  }
})