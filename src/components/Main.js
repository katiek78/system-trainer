'use client'
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear } from "@fortawesome/free-solid-svg-icons"

import Nav from "./Nav"

const Main = ({children}) => {

<main className="flex flex-col min-h-screen items-center p-24">
      
    <Nav />
{children}
</main>
}

export default Main