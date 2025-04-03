// pages/api/streetview.js

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { location, heading, pitch, fov } = req.query;

    const API_KEY = process.env.STREET_VIEW_API_KEY;

    // Construct the Street View URL with the provided parameters
    const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

    // Respond with the constructed URL
    res.status(200).json({ streetViewUrl });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
