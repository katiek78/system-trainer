export default async function handler(req, res) {
  const { query } = req.query; // The search query passed as a parameter

  const apiKey = process.env.GOOGLE_IMAGE_SEARCH_API_KEY; // Make sure to load the API key securely from the environment variable
  const cx = process.env.GOOGLE_CX; // The Custom Search Engine ID

  // Construct the URL to the Google Image Search API
  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&key=${apiKey}&cx=${cx}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("API Response:", data);
    console.log("API key", apiKey);

    // Return the image search results
    if (data.items) {
      res.status(200).json(data.items);
    } else {
      res.status(404).json({ message: "No images found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching image results", error: error.message });
  }
}
