import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getMovies } from "../api/index";
import MovieCard from "../components/MovieCart";
import { splitGenres } from "./Utils";

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Все");

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const genres = ["Все", ...new Set(movies.flatMap((m) => splitGenres(m.genre)))];

  const q = search.trim().toLowerCase();
  const filtered = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) &&
      (genre === "Все" || splitGenres(m.genre).includes(genre))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Все фильмы</h1>
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input bg-transparent! pl-10!"
          />
        </div>
      </div>

      {/* Жанры */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${genre === g ? "bg-lav-200" : "bg-white hover:bg-lav-100"
              }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-black/50">Загрузка...</p>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              ratio="aspect-[4/5]"
              subtitle={[splitGenres(m.genre)[0], m.duration && `${m.duration} мин`].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-black/50">
          Ничего не найдено. Измените запрос или жанр.
        </p>
      )}
    </div>
  );
}