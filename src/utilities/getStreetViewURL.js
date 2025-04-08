export async function getStreetViewUrl(
  location,
  heading = 90,
  pitch = 0,
  fov = 100,
  type
) {
  // Prepare the query string
  const queryString = new URLSearchParams({
    location: location,
    heading: heading.toString(),
    pitch: pitch.toString(),
    fov: fov.toString(),
    type: type,
  }).toString();

  try {
    const response = await fetch(`/api/streetView?${queryString}`);

    if (!response.ok) {
      console.error("Error: Failed to fetch the Street View URL", {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = await response.json();

    if (!data.streetViewUrl) {
      console.error("Error: The API response is missing the Street View URL.");
      return null; // Handle the case where the URL is missing in the response
    }

    return data.streetViewUrl;
  } catch (error) {
    console.error("Error fetching Street View URL:", error);
    return null; // Catch any errors during the fetch request and log them
  }
}
