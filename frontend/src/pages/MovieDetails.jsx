import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API, dateKey, makeDays, posterUrl, sessionRange, softChip, splitGenres, timeChip } from "./Utils";
import { getMovieById, getSessions } from "../api/index";
import DateStrip from "./Datestrip";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    Promise.all([getMovieById(id), getSessions(), fetch(`${API}/halls`).then((r) => r.json())])
      .then(([m, s, h]) => {
        setMovie(m);
        setHalls(h);
        setSessions(
          s
            .filter((x) => x.movie_id === Number(id))
            .filter((x) => new Date(x.date_time).getTime() > Date.now())
            .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-24 text-center text-black/50">Загрузка...</p>;
  if (!movie) return <p className="py-24 text-center text-black/50">Фильм не найден</p>;

  const days = makeDays(10);
  // по умолчанию открываем ближайший день, в котором есть сеансы
  const firstWithShows = days.map(dateKey).find((k) => sessions.some((s) => dateKey(new Date(s.date_time)) === k));
  const date = picked ?? firstWithShows ?? dateKey(days[0]);

  const ofDay = sessions.filter((s) => dateKey(new Date(s.date_time)) === date);
  const byHall = [...new Set(ofDay.map((s) => s.hall_id))].map((hid) => ({
    hall: halls.find((h) => h.id === hid)?.name || `Зал ${hid}`,
    items: ofDay.filter((s) => s.hall_id === hid),
  }));

  return (
    <div className="space-y-5">
      <Link to="/movies" className="inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black">
        <ArrowLeft size={16} /> Все фильмы
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,330px)_minmax(0,1fr)]">
        <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-lav-100">
          <img src={posterUrl(movie.poster, "400x500")} alt={movie.title} className="h-full w-full object-cover object-top" />
        </div>

        <div className="space-y-5">
          <section className="card">
            <h1 className="text-2xl font-semibold leading-tight">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {splitGenres(movie.genre).map((g) => (
                <span key={g} className={softChip}>{g}</span>
              ))}
              {movie.duration && <span className={softChip}>{movie.duration} мин</span>}
              {movie.age_rating && <span className={softChip}>{movie.age_rating}</span>}
            </div>
            <p className="mt-5 max-w-2xl leading-relaxed text-black/70">
              {movie.description || "Описание отсутствует"}
            </p>
          </section>

          <section className="card space-y-5">
            <h2 className="text-[15px] font-semibold">Расписание</h2>
            <DateStrip days={days} value={date} onChange={setPicked} />

            {byHall.length > 0 ? (
              <div className="space-y-4">
                {byHall.map(({ hall, items }) => (
                  <div key={hall}>
                    <p className="mb-2 text-sm text-black/60">{hall}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((s) => (
                        <Link key={s.id} to={`/?session=${s.id}`} className={timeChip}>
                          {sessionRange(s.date_time, movie.duration)} · {s.price} ₽
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/50">
                {sessions.length === 0
                  ? "Предстоящих сеансов пока нет."
                  : "На этот день сеансов нет. Выберите другой день."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}