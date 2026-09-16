import { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState("Detecting...");

  const detectLocation = () => {
    setLocation("Detecting...");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.state || "Unknown";
            setLocation(city);
          } catch (error) {
            setLocation("New Delhi"); // fallback
          }
        },
        (error) => {
          setLocation("New Delhi"); // fallback if denied
        }
      );
    } else {
      setLocation("New Delhi");
    }
  };

  useEffect(() => {
    if (location === "Detecting...") {
      detectLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, detectLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationState = () => useContext(LocationContext);

