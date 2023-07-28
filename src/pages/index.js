'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'

export default function Index() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  if (user) {
    return (      
      <>
       
        
           {/* <main className="flex min-h-screen flex-col items-center justify-between p-24"> */}
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
      {/* <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex"> */}
      <h1 className="font-mono text-6xl">System Trainer</h1>
      <p>
        Welcome {user.name}! 
        {/* {user.nickname}  */}
        {/* <a href="/api/auth/logout">Logout</a> */}
        </p>
       
      
       

      

      </div>
     
      </>
    );
  }

  return  <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
<h1 className="font-mono text-6xl flex flex-col">System Trainer app</h1>
<a href="/api/auth/signup">Sign up</a>
<a href="/api/auth/login">Log in</a>
</div>;
}


/*
//THIS WORKED ONCE I REMOVED THE COOKIE STUFF BUT DOESN'T DO QUITE WHAT I WANT
import { UserProfile } from '@auth0/nextjs-auth0/client'

const getUser = async (): Promise<UserProfile | null> => {
  const sessionCookie = cookies().get('appSession')?.value
  if (sessionCookie === undefined) return null
  const res = await fetch(`${process.env.AUTH0_BASE_URL}/api/auth/me`, {
    headers: {
      cookie: `appSession=${sessionCookie}`,
    },
  })
  return await (res.status === 200 ? res.json() : null)
}

const Home = async () => {
  const user = await getUser();

  return (
    <p>
      {JSON.stringify(user)}
      <br/>
      <a href="/api/auth/login">LOG IN</a>
    </p>
  )
};

export default Home

*/