import { useState } from "react";
import { CinemaContext } from "./CinemaContextValue";

export function CinemaProvider({ children }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);

  return (
    <CinemaContext.Provider
      value={{
        selectedMovie,
        setSelectedMovie,
        selectedSession,
        setSelectedSession,
        selectedHall,
        setSelectedHall,
      }}
    >
      {children}
    </CinemaContext.Provider>
  );
}