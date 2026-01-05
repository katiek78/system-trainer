"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faCopy } from "@fortawesome/free-solid-svg-icons";

export default function ImageSetsPage() {
  const router = useRouter();
  const [imageSets, setImageSets] = useState([]);
  const [publicImageSets, setPublicImageSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchImageSets = async () => {
      try {
        const res = await fetch("/api/imageSets/names");
        if (res.ok) {
          const data = await res.json();
          // Filter into private and public
          const privateImageSets = data.filter((set) => set.userId);
          const publicSets = data.filter((set) => !set.userId);
          setImageSets(privateImageSets);
          setPublicImageSets(publicSets);
        }
      } catch (error) {
        console.error("Error fetching image sets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImageSets();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this set?"
    );
    if (confirmed) {
      try {
        await fetch(`/api/imageSets/${id}`, {
          method: "Delete",
        });
        // Remove from state
        setImageSets(imageSets.filter((set) => set._id !== id));
      } catch (error) {
        setMessage("Failed to delete the set.");
      }
    }
  };

  const handleCopyPublic = async (id) => {
    try {
      // Send only the selected ImageSet ID to the server
      const res = await fetch(`/api/imageSets/copy/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(res.status + " when copying image set");
      }

      // Refresh the page to show the new copy
      router.refresh();
    } catch (error) {
      setMessage("Failed to copy image set. " + error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl w-full ">
        <h1 className="py-2 font-mono text-4xl">Image sets</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">What is an image set?</h3>
          <p className="font-mono">
            An image set is a group of images or words, each one associated with
            a digit or group of digits, or a card or group of cards. For
            instance, if you use a 2-digit approach, you'll need an image set
            that assigns an image to each pair of digits from 00 to 99 (e.g.
            '00' is 'sauce', '01' is a 'seat').
          </p>
        </div>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h2 className="text-2xl font-semibold">My private image sets</h2>
          <p className="font-mono">
            You currently have{" "}
            {imageSets.length === 0 ? "no private " : imageSets.length} image{" "}
            {imageSets.length === 1 ? "set" : "sets"}.
          </p>
          <br />
          {imageSets.length > 0 &&
            imageSets.map((imageSet) => (
              <p key={imageSet._id} className="font-semibold">
                {" "}
                <Link href={`/imageSets/${imageSet._id}/`}>
                  {imageSet.name}
                </Link>
                <FontAwesomeIcon
                  className="ml-5 cursor-pointer"
                  onClick={() => handleDelete(imageSet._id)}
                  icon={faTrash}
                  size="1x"
                />
              </p>
            ))}
          <Link href="/newImageSet">
            <button className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline">
              Add new image set
            </button>
          </Link>
        </div>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h2 className="text-2xl font-semibold">Public image sets</h2>
          <p className="font-mono">
            There {publicImageSets.length === 1 ? "is" : "are"}{" "}
            {publicImageSets.length} public image{" "}
            {publicImageSets.length === 1 ? "set" : "sets"} available. Click the{" "}
            <FontAwesomeIcon icon={faCopy} size="1x" /> icon next to a set to
            make a private copy of that set, which you can then edit.
          </p>
          <br />
          {publicImageSets.length > 0 &&
            publicImageSets.map((imageSet) => (
              <p key={imageSet._id} className="font-semibold">
                {" "}
                <Link href={`/imageSets/${imageSet._id}/`}>
                  {imageSet.name}
                </Link>{" "}
                <FontAwesomeIcon
                  className="ml-5 cursor-pointer"
                  icon={faCopy}
                  size="1x"
                  onClick={() => handleCopyPublic(imageSet._id)}
                />
              </p>
            ))}
        </div>
      </div>
      <div>{message}</div>
    </>
  );
}
