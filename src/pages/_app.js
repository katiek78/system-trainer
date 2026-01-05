import { useState } from "react";
import "../app/globals.css";
import { Inter } from "next/font/google";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGear, faUser } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
// import { Main } from '../app/components/Main'

export default function MyApp({ Component, pageProps }) {
  return <AppContent Component={Component} pageProps={pageProps}></AppContent>;
}

function AppContent({ Component, pageProps }) {
  const { user, isLoading } = useUser();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track if the menu is open

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
        {/* Navigation moved to app/layout.js */}
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
