import { useContext } from "react";
import { CinemaContext } from "./CinemaContextValue";

export function useCinema() {
    return useContext(CinemaContext);
}