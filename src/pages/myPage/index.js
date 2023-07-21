
import { withPageAuthRequired, getSession} from "@auth0/nextjs-auth0";
import dbConnect from "@/lib/dbConnect";
import Word from "@/models/Word";

const Dashboard = ({user, words}) => {
  
  return(
<p>Hello {user.nickname} - there are {words.length} words in the database.</p>
  )
}

export default Dashboard;

// export default Dashboard;
export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = getSession(req, res);
    await dbConnect()

    // Fetch the user from the db (by email)
   // let user = await db.user.findUnique({ where: { email: auth0User?.user.email } });

    // You might want to move the creation of the user somewhere else like afterCallback
    // Checkout https://auth0.github.io/nextjs-auth0/modules/handlers_callback.html
    // if (!user) {
    //   user = db.user.create(auth0User?.user);
    // } 

/* find all the data in our database */
const result = await Word.find({})
const words = result.map((doc) => {
  const word = doc.toObject()
  word._id = word._id.toString()
  return word
})

    return {
      props: {
        // dbUser: user,
        user: (await auth0User).user,
        words: words
      },
    };
  },
})

