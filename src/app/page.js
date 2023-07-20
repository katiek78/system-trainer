'use client';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Index() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  if (user) {
    return (
      <div>
        Welcome {user.name}! <a href="/api/auth/logout">Logout</a>
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