'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react';
import './styles.css';
import { ML_DISCIPLINES, TRADITIONAL_DISCIPLINES } from '@/lib/disciplines'

export default function Index() {
  const { user, error, isLoading } = useUser();
  const [ randomChoice, setRandomChoice ] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const handleRandom = () => {
    const bigArrayOfDisciplines = [...ML_DISCIPLINES, ...TRADITIONAL_DISCIPLINES];
    setShowAnimation(true);

    const timeout = setTimeout(() => {
     
      const choice = Math.floor(Math.random() * bigArrayOfDisciplines.length)
      setRandomChoice(bigArrayOfDisciplines[choice])
      setShowAnimation(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }

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
        {/* <br />ID is: { user.sub } */}
        {/* {user.nickname}  */}
        {/* <a href="/api/auth/logout">Logout</a> */}
</p>
<br /><br />
<div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
    <h3 className="font-semibold">Welcome to System Trainer</h3>
    <p className="font-mono">Please take a look around! You can add your image sets, systems, journeys and log your memory training. Meanwhile, get a random training suggestion by clicking the button below!</p>
    </div>

        <br /><br />
        <button onClick={handleRandom} className="btn bg-black dark:bg-slate-500 hover:bg-gray-700 text-white text-lg font-bold mt-3 py-3 px-6 rounded focus:outline-none focus:shadow-outline">
          What should I train next?
        </button>
        {/* {randomChoice && <div className="bg-white w-auto font-bold rounded text-lg mt-5 py-3 px-6">{randomChoice}</div>} */}
        
        <br />
        {showAnimation ? (
        <div className="animation"></div>
      ) : (
       <> {randomChoice && <div className="result bg-white dark:bg-slate-800 w-auto font-bold rounded text-lg mt-5 py-3 px-6">{randomChoice}</div>}</>
      )}

        {/* <div className={`animation ${showAnimation ? 'show' : 'hide'}`}></div>
      {!showAnimation && <div className="result">{randomChoice}</div>} */}

      
       

      

      </div>
     
      </>
    );
  }

  return  <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
<h1 className="font-mono text-6xl flex flex-col">System Trainer app</h1>
<a className="text-blue-500 hover:text-blue-700 visited:text-blue-500 visited:hover:text-blue-700" href="/api/auth/signup">Sign up</a> or <a className="text-blue-500 hover:text-blue-700 visited:text-blue-500 visited:hover:text-blue-700" href="/api/auth/login">Log in</a> to get started!
</div>
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