import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { API, dateKey, makeDays, sessionRange, softChip, splitGenres, timeChip } from "./Utils";
import { getMovies } from "../api/index";
import DateStrip from "./Datestrip";
import MovieCard from "../components/MovieCart";

export default function Sessions() {
  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([getMovies(), fetch(`${API}/sessions`).then((r) => r.json()), fetch(`${API}/halls`).then((r) => r.json())])
      .then(([m, s, h]) => {
        setMovies(m);
        setHalls(h);
        setSessions(s.filter((x) => new Date(x.date_time).getTime() > Date.now()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const days = makeDays(10);
  const q = search.trim().toLowerCase();
  const ofDay = sessions
    .filter((s) => dateKey(new Date(s.date_time)) === date)
    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

  const rows = movies
    .filter((m) => m.title.toLowerCase().includes(q))
    .map((m) => {
      const list = ofDay.filter((s) => s.movie_id === m.id);
      const byHall = [...new Set(list.map((s) => s.hall_id))].map((hid) => ({
        hall: halls.find((h) => h.id === hid)?.name || `Зал ${hid}`,
        items: list.filter((s) => s.hall_id === hid),
      }));
      return { movie: m, byHall };
    })
    .filter((r) => r.byHall.length > 0);

  return (
    <div className="space-y-5">
      <DateStrip days={days} value={date} onChange={setDate} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Сеансы</h1>
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

      {loading ? (
        <p className="py-20 text-center text-black/50">Загрузка...</p>
      ) : rows.length === 0 ? (
        <div className="card py-14 text-center">
          <p className="text-[15px] font-semibold">На этот день сеансов нет</p>
          <p className="mt-1 text-sm text-black/50">Выберите другой день в полосе сверху.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ movie, byHall }) => (
            <section key={movie.id} className="card flex gap-5 p-4!">
              <div className="w-28 shrink-0 sm:w-36">
                <MovieCard movie={movie} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold">{movie.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {splitGenres(movie.genre).map((g) => (
                    <span key={g} className={softChip}>{g}</span>
                  ))}
                  {movie.duration && <span className={softChip}>{movie.duration} мин</span>}
                  {movie.age_rating && <span className={softChip}>{movie.age_rating}</span>}
                </div>

                <div className="mt-4 space-y-3">
                  {byHall.map(({ hall, items }) => (
                    <div key={hall} className="flex flex-wrap items-center gap-2">
                      <span className="w-full text-sm text-black/60 sm:w-32">{hall}</span>
                      {items.map((s) => (
                        <Link key={s.id} to={`/?session=${s.id}`} className={timeChip}>
                          {sessionRange(s.date_time, movie.duration)} · {s.price} ₽
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}