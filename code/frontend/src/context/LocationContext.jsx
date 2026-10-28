import { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

const SUPPORTED_CITIES = ["Patiala", "Delhi", "Chandigarh", "Ludhiana", "Mohali"];

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(() => {
    return localStorage.getItem("serveconnect_location") || "Patiala";
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");

  const setLocation = (newLoc) => {
    const clean = newLoc ? newLoc.trim() : "Patiala";
    localStorage.setItem("serveconnect_location", clean);
    setLocationState(clean);
    setLocationError("");
  };

  const detectLocation = () => {
    setIsDetecting(true);
    setLocationError("");

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await response.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.state_district ||
            data.address?.state ||
            "Patiala";

          // Match detected against known supported cities if possible
          const matched = SUPPORTED_CITIES.find(
            (c) => c.toLowerCase() === detected.toLowerCase()
          );

          const finalCity = matched || detected;
          setLocation(finalCity);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocationError("Could not resolve city address. Defaulted to Patiala.");
          setLocation("Patiala");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission error:", error.message);
        if (error.code === 1) {
          setLocationError("Location permission denied. Please select your city manually.");
        } else {
          setLocationError("Unable to retrieve location. Please choose a city below.");
        }
        setIsDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        detectLocation,
        isDetecting,
        locationError,
        supportedCities: SUPPORTED_CITIES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationState = () => useContext(LocationContext);
