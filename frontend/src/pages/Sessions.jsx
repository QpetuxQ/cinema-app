import { useState, useEffect } from "react";
import { getMovies } from "../api/index.js";
import { Link } from "react-router-dom";

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/sessions").then((r) => r.json()),
      getMovies(),
    ])
      .then(([sessionsData, moviesData]) => {
        const now = new Date();

        // 🔹 Берём только будущие сеансы
        const upcoming = sessionsData.filter((s) => {
          const sessionDate = new Date(s.date_time);
          return sessionDate.getTime() > now.getTime();
        });

        // 🔹 Сортируем по времени
        upcoming.sort(
          (a, b) => new Date(a.date_time) - new Date(b.date_time)
        );

        // 🔹 Группируем по movie_id и берём ближайший для каждого фильма
        const nearestPerMovie = Object.values(
          upcoming.reduce((acc, session) => {
            if (
              !acc[session.movie_id] ||
              new Date(session.date_time) < new Date(acc[session.movie_id].date_time)
            ) {
              acc[session.movie_id] = session;
            }
            return acc;
          }, {})
        );

        setMovies(moviesData);
        setSessions(nearestPerMovie);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getMovie = (id) => movies.find((m) => m.id === id);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="text-center text-gray-400 py-20">
        ⏳ Загрузка сеансов...
      </div>
    );

  if (sessions.length === 0)
    return (
      <div className="text-center text-gray-300 py-20">
        <h2 className="text-2xl font-semibold mb-3">
          😕 Нет предстоящих сеансов
        </h2>
        <p>Попробуйте позже — новые показы скоро появятся.</p>
      </div>
    );

  return (
    <div className="bg-black min-h-screen text-white px-10 py-12">
      <h1 className="text-4xl font-bold mb-10 border-l-4 border-red-600 pl-3 flex items-center gap-2">
        🎬 Ближайшие сеансы по фильмам
      </h1>

      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sessions.map((s) => {
          const movie = getMovie(s.movie_id);
          if (!movie) return null;

          return (
            <Link
              key={s.id}
              to={`/movies/${movie.id}`}
              className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-red-800/40 hover:-translate-y-1 transition-all"
            >
              {/* 🎞 Постер */}
              {movie.poster ? (
                <img
                  src={`http://127.0.0.1:8000${movie.poster}`}
                  alt={movie.title}
                  className="w-full h-[260px] object-cover"
                />
              ) : (
                <div className="h-[260px] flex items-center justify-center bg-gray-700 text-gray-400">
                  🎞 Постер отсутствует
                </div>
              )}

              {/* 📋 Информация */}
              <div className="p-5 flex flex-col justify-between h-[200px]">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {movie.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    🕒 {formatDate(s.date_time)}
                  </p>
                  <p className="text-gray-400 text-sm mb-2">
                    🏟 Зал {s.hall_id}
                  </p>
                  <p className="text-red-500 font-semibold text-lg mb-4">
                    💰 {s.price} ₽
                  </p>
                </div>

                <div className="text-center text-sm text-gray-400 italic">
                  Нажмите, чтобы увидеть все сеансы
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}