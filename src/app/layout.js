"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import Test from "@/components/Test";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const { user, isLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserSubMenu, setShowUserSubMenu] = useState(false);
  const toggleNavBar = () => setIsMenuOpen(!isMenuOpen);
  const handleUserSubMenuToggle = () => setShowUserSubMenu(!showUserSubMenu);

  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="main-div flex flex-col min-h-screen items-center p-24">
          <nav className="justify-between text-lg font-mono bg-white dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-600">
            <div className="max-w-screen-xl flex flex-wrap justify-items-end mx-auto p-4">
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
                  {user && (
                    <>
                      <li>
                        <Link
                          href="/imageSets"
                          onClick={toggleNavBar}
                          className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                        >
                          My image sets
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
                          My journeys
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
                      <li>
                        <div className="relative">
                          <button
                            className="flex items-center focus:outline-none"
                            onClick={handleUserSubMenuToggle}
                          >
                            <img
                              src={user.picture}
                              alt={user.name}
                              className="h-8 w-8 rounded-full"
                            />
                            &nbsp;
                            <span className="font-medium">{user.email}</span>
                          </button>
                          {showUserSubMenu && (
                            <div
                              className="absolute bg-white shadow-md mt-2 rounded-lg text-gray-800"
                              style={{ minWidth: "7rem" }}
                            >
                              <Link
                                href="/auth/logout"
                                onClick={toggleNavBar}
                                className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100"
                              >
                                Log out
                              </Link>
                            </div>
                          )}
                        </div>
                      </li>
                    </>
                  )}
                  {!user && (
                    <>
                      <li>
                        <Link
                          href="/auth/login"
                          onClick={toggleNavBar}
                          className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                        >
                          Log in
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/auth/login?screen_hint=signup&prompt=login"
                          onClick={toggleNavBar}
                          className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                        >
                          Sign up
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </nav>
          <br />
          {children}
          <Test />
        </main>
      </body>
    </html>
  );
}
