// pages/api/streetview.js

// export default async function handler(req, res) {
//   if (req.method === "GET") {
//     const { location, heading, pitch, fov } = req.query;

//     const API_KEY = process.env.STREET_VIEW_API_KEY;

//     // Construct the Street View URL with the provided parameters
//     //  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`;
//     const streetViewUrl = `https://www.googleapis.com/maps/api/streetview?key=${API_KEY}&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

//     // Respond with the constructed URL
//     res.status(200).json({ streetViewUrl });
//   } else {
//     res.status(405).json({ message: "Method Not Allowed" });
//   }
// }

// export default async function handler(req, res) {
//   if (req.method === "GET") {
//     const { location, heading, pitch, fov } = req.query;

//     const API_KEY = process.env.STREET_VIEW_API_KEY;

//     // Construct the Street View Static API URL (static image)
//     const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=320x240&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;

//     // Respond with the static image URL
//     res.status(200).json({ streetViewUrl });
//   } else {
//     res.status(405).json({ message: "Method Not Allowed" });
//   }
// }

// export default async function handler(req, res) {
//   if (req.method === "GET") {
//     const { location, heading, pitch, fov, type } = req.query;

//     const API_KEY = process.env.STREET_VIEW_API_KEY;

//     if (type === "image") {
//       // Fetch static image URL
//       const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;
//       res.status(200).json({ streetViewUrl });
//     } else {
//       // Fetch embed URL for the iframe
//       const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`;
//       res.status(200).json({ streetViewUrl });
//     }
//   } else {
//     res.status(405).json({ message: "Method Not Allowed" });
//   }
// }

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { location, heading, pitch, fov, type } = req.query;

    if (!location || !heading || !pitch || !fov || !type) {
      console.error("Missing parameters in the request.");
      return res
        .status(400)
        .json({ message: "Bad Request: Missing parameters." });
    }

    const API_KEY = process.env.STREET_VIEW_API_KEY;
    const IMAGE_API_KEY = process.env.GOOGLE_IMAGE_SEARCH_API_KEY;
    if (!API_KEY) {
      console.error("API Key is missing.");
      return res.status(500).json({ message: "API Key is missing." });
    }

    try {
      if (type === "image") {
        // Fetch static image URL
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${IMAGE_API_KEY}`;

        return res.status(200).json({ streetViewUrl });
      } else {
        // Fetch embed URL for the iframe
        const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${location}&heading=${heading}&pitch=${pitch}&fov=${fov}`;
        return res.status(200).json({ streetViewUrl });
      }
    } catch (error) {
      console.error("Error constructing Street View URL:", error);
      return res
        .status(500)
        .json({ message: "Failed to construct Street View URL" });
    }
  } else {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}
