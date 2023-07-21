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
      <div>
        Welcome {user.name}! <a href="/api/auth/logout">Logout</a>

        <div className="navbar">
        <div className="app-title">Train 11+</div>
        <div className="navbar-toggle" /*onClick={toggleLinks}*/>
          <span className="toggle-icon"></span>
        </div>
        <div className=''/*{`navbar-links ${showLinks ? "show" : ""}`}*/>
          <Link href="/">Home</Link>
          <Link href="/new">New System</Link>
          <Link href="/settings"><FontAwesomeIcon icon={faGear} /></Link>
        </div>

        <img
          id="title"
          src=""
          alt=""
        ></img>
        
      </div>
      </div>
    );
  }

  return <a href="/api/auth/login">Login</a>;
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