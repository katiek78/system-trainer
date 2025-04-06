import { useState } from "react";
import "../app/globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGear, faUser } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
// import { Main } from '../app/components/Main'

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <AppContent Component={Component} pageProps={pageProps}></AppContent>
    </UserProvider>
  );
}

function AppContent({ Component, pageProps }) {
  const { user, isLoading } = useUser();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track if the menu is open

  // const toggleNavBar = () => {
  //   if (
  //     document.getElementById("navbar-default").classList.contains("hidden")
  //   ) {
  //     document.getElementById("navbar-default").classList.remove("hidden");
  //     document.getElementById("navbar-default").classList.add("block");
  //   } else if (
  //     document.getElementById("navbar-default").classList.contains("block")
  //   ) {
  //     document.getElementById("navbar-default").classList.remove("block");
  //     document.getElementById("navbar-default").classList.add("hidden");
  //   }
  // };

  const toggleNavBar = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [showUserSubMenu, setShowUserSubMenu] = useState(false);

  const handleUserSubMenuToggle = () => {
    setShowUserSubMenu(!showUserSubMenu);
  };

  return (
    <div className="wrapper">
      <main className="main-div flex flex-col min-h-screen items-center">
        <nav className="justify-between text-lg font-mono bg-white dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-600">
          <div className="max-w-screen-xl flex flex-wrap justify-items-end mx-auto p-4">
            {/* Hamburger icon for mobile */}
            <div className="block md:hidden" onClick={toggleNavBar}>
              <FontAwesomeIcon icon={faBars} size="lg" />
            </div>

            <div
              className={`w-full md:block md:w-auto ${
                isMenuOpen ? "block" : "hidden"
              }`}
              id="navbar-default"
            >
              <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <Link
                    href="/"
                    className="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500"
                    aria-current="page"
                  >
                    Home
                  </Link>
                </li>
                {/* <li>
          <Link href="/systems" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Systems</Link>
        </li> */}
                <li>
                  <Link
                    href="/imageSets"
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Image sets
                  </Link>
                </li>
                <li>
                  <Link
                    href={{
                      pathname: "/journeys",
                      query: { startWithJourneyView: "true" },
                    }}
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Journeys
                  </Link>
                </li>
                <li>
                  <Link
                    href="/log"
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Training log
                  </Link>
                </li>

                <li>
                  <Link
                    href="/training"
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Training
                  </Link>
                </li>

                <li>
                  <Link
                    href="/plan"
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Training plan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/goals"
                    onClick={toggleNavBar}
                    className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    Goals
                  </Link>
                </li>
                {/* <li>
          <Link href="/settings" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"> <FontAwesomeIcon icon={faGear} size="1x" /></Link>
        </li> */}
                {user && (
                  <li>
                    <div className="relative">
                      <button
                        className="flex items-center focus:outline-none"
                        onClick={handleUserSubMenuToggle}
                      >
                        {/* <FontAwesomeIcon icon={faUser} className="mt-1 mr-2" /> */}
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="h-8 w-8 rounded-full"
                        />
                        &nbsp;
                        <span className="font-medium">{user.email}</span>
                      </button>
                      {user && showUserSubMenu && (
                        <div
                          className="absolute bg-white shadow-md mt-2 rounded-lg text-gray-800"
                          style={{ minWidth: "7rem" }}
                        >
                          <Link
                            href="/api/auth/logout"
                            onClick={toggleNavBar}
                            className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100"
                          >
                            Log out
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                )}
                {/* { user &&
        <li>
          <Link href="/api/auth/logout" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Log out</Link>
        </li>
        } */}

                {!user && (
                  <>
                    <li>
                      <Link
                        href="/api/auth/login"
                        onClick={toggleNavBar}
                        className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                      >
                        Log in
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/api/auth/login?screen_hint=signup&prompt=login"
                        onClick={toggleNavBar}
                        className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                      >
                        Sign up
                      </Link>
                    </li>
                  </>
                )}
                {/* <li>
          <a href="#" class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Contact</a>
        </li> */}
              </ul>
            </div>
          </div>
        </nav>
        <br />
        <Component {...pageProps} />
      </main>
      {/* <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2023 The Memory Place. All rights reserved.</p>
        <p>Contact me at test@gmail.com</p>
      </div>
    </footer> */}
    </div>
  );
}
