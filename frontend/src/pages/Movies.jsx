import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMovies } from "../api/index";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Все");

  useEffect(() => {
    getMovies().then(setMovies).catch(console.error);
  }, []);

  const genres = ["Все", ...new Set(movies.map((m) => m.genre).filter(Boolean))];

  const filtered = movies.filter((m) => {
    const matchesTitle = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genre === "Все" || m.genre === genre;
    return matchesTitle && matchesGenre;
  });

  return (
    <div className="bg-black text-white min-h-screen pt-24 px-10">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
        <h1 className="text-4xl font-bold mb-6 md:mb-0">🎥 Все фильмы</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-red-600 outline-none w-64"
          />

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 focus:ring-2 focus:ring-red-600 outline-none"
          >
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Сетка фильмов */}
      <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.length > 0 ? (
          filtered.map((movie) => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="group relative overflow-hidden rounded-xl shadow-lg bg-gray-900 hover:scale-105 transition duration-300"
            >
              {/* Постер */}
              <img
                src={
                  movie.poster
                    ? `http://127.0.0.1:8000${movie.poster}`
                    : "https://placehold.co/300x450?text=No+Poster"
                }
                alt={movie.title}
                className="object-cover w-full h-[380px] group-hover:opacity-80 transition duration-300"
              />

              {/* Градиент + текст */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-4">
                <h2 className="text-lg font-bold mb-1">{movie.title}</h2>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {movie.description || "Описание отсутствует"}
                </p>
                {movie.genre && (
                  <span className="text-xs bg-red-600 px-2 py-1 rounded mt-2 w-fit font-semibold">
                    {movie.genre}
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-400 col-span-full text-center py-20 text-lg">
            🎞️ Фильмы не найдены
          </p>
        )}
      </div>
    </div>
  );
}