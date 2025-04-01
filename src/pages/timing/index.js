import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import dbConnect from "@/lib/dbConnect";
import { getRequiredBPM } from "@/utilities/timing";
import { ML_DISCIPLINES } from "@/lib/disciplines";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

const TimingPage = ({ user }) => {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    discipline: ML_DISCIPLINES[0],
    time: "",
    grouping: "",
    grabData: "",
    grabTime: "",
  });
  const [bpm, setBpm] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [songs, setSongs] = useState([]);
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPreview = (previewUrl) => {
    if (audio) {
      if (audio.src === previewUrl && isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.src = previewUrl;
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const spotify_client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  /* The POST method adds a new entry in the mongodb database. */
  const getAccessToken = async () => {
    const authOptions = {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString(
            "base64"
          ),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    };

    try {
      const response = await fetch(
        "https://accounts.spotify.com/api/token",
        authOptions
      );
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  const getSongs = async () => {
    const songRecommendations = [];
    // const seedGenres = 'funk,pop,rock,alt-rock,british,dance,hip-hop,indie,electro,electronic'
    const seedGenres = "funk,pop,rock";

    try {
      for (const targetTempo of bpm) {
        const fetchTracksByTempo = async (accessToken, query, targetTempo) => {
          try {
            // Step 1: Search for tracks based on the query
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const searchData = await searchResponse.json();
            const tracks = searchData.tracks.items;

            // Step 2: Get audio features for each track
            const trackIds = tracks.map((track) => track.id);
            const audioFeaturesResponse = await fetch(
              `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(
                ","
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const audioFeaturesData = await audioFeaturesResponse.json();

            // Step 3: Filter tracks by tempo
            const filteredTracks = tracks.filter((track, index) => {
              const tempo = audioFeaturesData.audio_features[index].tempo;
              return tempo === targetTempo;
            });

            return filteredTracks;
          } catch (error) {
            console.error("Error fetching tracks:", error);
            return [];
          }
        };

        // Example usage: Get tracks with tempo between 80 and 100 BPM
        const tracks = await fetchTracksByTempo(
          accessToken,
          "funk",
          targetTempo
        );
        console.log(tracks);

        // const data = await response.json();
        // console.log(data);
        if (tracks) songRecommendations.push(...tracks); // Collect tracks from recommendations
      }

      // Shuffle the song recommendations randomly
      const shuffledRecommendations = songRecommendations.sort(
        () => Math.random() - 0.5
      );

      // Return the first 20 shuffled song recommendations
      return shuffledRecommendations.slice(0, 20);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw new Error("Internal Server Error");
    }
  };

  useEffect(() => {
    setAudio(new Audio());
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getAccessToken(); // Your async function call
        setAccessToken(token);
      } catch (error) {
        // Handle errors
        console.error("Error fetching access token:", error);
      }
    }

    fetchData(); // Call the async function immediately inside useEffect
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (accessToken && bpm.length > 0) {
          const songs = await getSongs(); // Your async function call
          setSongs(songs);
        }
      } catch (error) {
        // Handle errors
        console.error("Error fetching songs:", error);
      }
    }

    fetchData(); // Call the async function immediately inside useEffect
  }, [bpm, accessToken]);

  const getUnits = (discipline) => {
    // Split the input string into words
    const words = discipline.trim().split(/\s+/);

    // Check if there are at least two words in the input
    if (words.length >= 2) {
      // Return the second word converted to lowercase
      return words[words.length - 1].toLowerCase();
    } else {
      // If there's no second word, return an empty string or handle it as needed
      return words[0].toLowerCase();
    }
  };

  const handleCalculate = () => {
    if (form.time === "") {
      alert("You need to enter your target time.");
      return;
    }
    const requiredBPM = getRequiredBPM(
      form.discipline,
      form.grouping,
      form.grabData,
      form.grabTime,
      form.time
    );
    setBpm(requiredBPM);
  };

  const handleChange = (e) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    setForm({
      ...form,
      [name]: value,
    });
  };

  return (
    <>
      <div className="z-10 justify-between font-mono text-lg max-w-5xl">
        <h1 className="py-2 font-mono text-4xl">Calculate timing</h1>

        <br />
        <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
          <h3 className="font-semibold">
            Calculate the BPM for your target time
          </h3>
          <p className="font-mono">
            Select your discipline, target time and a couple of other details
            and you'll be given a BPM. You can even find songs that match the
            BPM to help you get a feel for the timing.
          </p>
        </div>
      </div>
      <br />
      <div className="bg-white dark:bg-slate-800 py-5 px-5 rounded">
        <form>
          I want to achieve a time of
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="7"
            name="time"
            value={form.time}
            onChange={handleChange}
          />{" "}
          seconds&nbsp; in:
          <select
            className="shadow appearance-none border rounded w-full mt-1 mx-3 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="discipline"
            value={form.discipline || ML_DISCIPLINES[0]}
            onChange={handleChange}
            required
          >
            {ML_DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          with a grouping of:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grouping"
            value={form.grouping}
            onChange={handleChange}
          />{" "}
          {getUnits(form.discipline)} &nbsp; and grabbing:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grabData"
            value={form.grabData}
            onChange={handleChange}
          />{" "}
          {getUnits(form.discipline)} &nbsp; in:
          <input
            className="shadow appearance-none border rounded w-14 ml-3 mt-1 mb-2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            maxLength="2"
            name="grabTime"
            value={form.grabTime}
            onChange={handleChange}
          />{" "}
          seconds &nbsp;
          <br />
          <button
            type="button"
            onClick={handleCalculate}
            className="btn bg-black hover:bg-gray-700 text-white font-bold mt-3 py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Calculate
          </button>
          {bpm && (
            <>
              <div className="text-center">
                <p className="mt-5 text-5xl">
                  Your required BPM is: {bpm.join(" / ")}
                </p>
                <div className="mx-4 md:mx-auto md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                  <p className="mt-4 text-2xl font-bold">
                    Songs with this BPM include:
                  </p>
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* {songs?.tracks && songs.tracks.map((song, index) => ( */}
                    {songs &&
                      songs.map((song, index) => (
                        <li
                          key={index}
                          className="border rounded relative group overflow-hidden mb-4 sm:mb-0"
                          onClick={() => handlePlayPreview(song.preview_url)}
                        >
                          <div className="flex items-start">
                            <img
                              src={song.album.images[0].url}
                              alt={`${song.name} Album Cover`}
                              className="w-20 h-full rounded-md object-cover"
                            />
                            <div className="ml-2">
                              <p className="text-lg font-semibold">
                                {song.artists[0].name} - {song.name}
                              </p>
                              {song.preview_url && ( // Render play icon only if preview_url exists
                                <div className="text-gray-500">
                                  <FontAwesomeIcon icon={faPlay} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 ${
                              isPlaying && audio.src === song.preview_url
                                ? "block"
                                : "hidden"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 5v10l6-5-6-5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </>
          )}
          <div>
            {Object.keys(errors).map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </div>
        </form>
      </div>
    </>
  );
};

export default TimingPage;

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = await getSession(req, res);
    const db = await dbConnect();
    const user = auth0User.user;

    // Function to fetch log entries with pagination

    return {
      props: {
        user,
      },
    };
  },
});
