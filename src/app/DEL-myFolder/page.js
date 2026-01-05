"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Index = () => {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (!user) return null;

  if (user) {
    return (
      <main className="flex flex-col min-h-screen items-center p-24">
        <div>
          Welcome {user.name}! <a href="/auth/logout">Logout</a>
          <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
            <h1>
              System Trainer subpage - hello {user && user.name}
              {!user && "random person"}!
            </h1>
            <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
              <a href="/auth/login?screen_hint=signup">Sign up</a>
              <a href="/auth/login">Login</a>
              <a href="/auth/logout">Logout</a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <a href="/auth/login">Login</a>;
};

export default Index;
//);
