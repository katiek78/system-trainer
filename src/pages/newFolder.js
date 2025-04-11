import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import JourneyFolderForm from "@/components/JourneyFolderForm";

const NewJourneyFolderPage = ({ user }) => {
  const journeyFolderForm = {
    name: "",
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">New journey folder</h1>

        <JourneyFolderForm
          userId={user.sub}
          formId="add-journey-folder-form"
          journeyFolderForm={journeyFolderForm}
        />
      </div>
    </>
  );
};

export default NewJourneyFolderPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ params, req, res }) => {
    const auth0User = await getSession(req, res);
    const user = auth0User.user;
    await dbConnect();

    return { props: { user } };
  },
});
