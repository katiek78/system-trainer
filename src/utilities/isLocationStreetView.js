// Utility function to check if a location string is a Street View (coordinates or address)
export function isLocationStreetView(location) {
  // Accepts coordinates (e.g., "51.5074,-0.1278") or address starting with a digit or minus sign
  return typeof location === "string" && /^[-\d]/.test(location);
}
