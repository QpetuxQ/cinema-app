import { useEffect, useState } from "react";
import { getMovies, getSessions } from "../api/index.js";
import { Link } from "react-router-dom";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    Promise.all([
      getMovies(),
      getSessions(),
      fetch("http://127.0.0.1:8000/halls").then((r) => r.json()),
    ])
      .then(([moviesData, sessionsData, hallsData]) => {
        setMovies(moviesData);
        setHalls(hallsData);

        const now = new Date();

        const upcoming = sessionsData.filter((s) => {
          const sessionDate = new Date(s.date_time);
          return sessionDate.getTime() > now.getTime();
        });

        upcoming.sort(
          (a, b) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        );

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

        setSessions(nearestPerMovie);
      })
      .catch(console.error);
  }, []);

  const hero = movies[0];

  const formatDateTime = (dateTimeStr) => {
    const d = new Date(dateTimeStr);
    const dateStr = d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
    });
    const timeStr = d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} в ${timeStr}`;
  };

  const getHallName = (id) => {
    const hall = halls.find((h) => h.id === id);
    return hall ? hall.name : `Зал ${id}`;
  };

  // 🗓 Определяем "сегодня / завтра / дату"
  const getDateLabel = (dateStr) => {
    const sessionDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday =
      sessionDate.toDateString() === today.toDateString();
    const isTomorrow =
      sessionDate.toDateString() === tomorrow.toDateString();

    if (isToday) return "Сегодня";
    if (isTomorrow) return "Завтра";
    return sessionDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* 🎥 HERO блок */}
      {hero && (
        <section
          className="relative h-[90vh] flex items-end px-12 pb-24"
          style={{
            backgroundImage: `url(${
              hero.poster
                ? `http://127.0.0.1:8000${hero.poster}`
                : "/no-poster.png"
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
              {hero.title}
            </h1>
            <p className="text-gray-300 text-lg mb-8 line-clamp-3">
              {hero.description || "Описание скоро появится."}
            </p>

            <div className="flex gap-4">
              <Link
                to={`/movies/${hero.id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-semibold flex items-center gap-2 transition"
              >
                ▶ Смотреть
              </Link>
              <Link
                to="/movies"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-md font-semibold transition"
              >
                Все фильмы
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 🔥 Сейчас в кино */}
      <section className="px-12 py-12">
        <h2 className="text-3xl font-bold mb-6 border-l-4 border-red-600 pl-3">
          🔥 Сейчас в кино
        </h2>

        <div className="flex overflow-x-auto gap-6 scrollbar-hide pb-4">
          {movies.map((m) => (
            <Link
              key={m.id}
              to={`/movies/${m.id}`}
              className="min-w-[200px] group relative"
            >
              <img
                src={
                  m.poster
                    ? `http://127.0.0.1:8000${m.poster}`
                    : "https://via.placeholder.com/200x300?text=No+Poster"
                }
                alt={m.title}
                className="rounded-lg object-cover w-[200px] h-[300px] group-hover:opacity-90 transition"
              />
              <div className="absolute bottom-2 left-2 text-sm font-semibold text-white drop-shadow-md">
                {m.title}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🎟️ Предстоящие сеансы */}
      <section className="px-12 pb-16">
        <h2 className="text-3xl font-bold mb-6 border-l-4 border-red-600 pl-3 flex items-center gap-2">
          🎟️ Предстоящие сеансы
        </h2>

        {sessions.length === 0 ? (
          <p className="text-gray-400">Нет запланированных сеансов.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sessions.slice(0, 8).map((s) => {
              const movie = movies.find((m) => m.id === s.movie_id);
              const hallName = getHallName(s.hall_id);
              const dateLabel = getDateLabel(s.date_time);

              return (
                <div
                  key={s.id}
                  className="bg-gray-900 rounded-lg p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition"
                >
                  {movie?.poster && (
                    <img
                      src={`http://127.0.0.1:8000${movie.poster}`}
                      alt={movie.title}
                      className="rounded-md mb-4 object-cover h-[220px] w-full"
                    />
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">
                    {movie ? movie.title : "Неизвестный фильм"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    🕒 {formatDateTime(s.date_time)}
                  </p>
                  <p className="text-gray-500 text-xs mb-2">📅 {dateLabel}</p>
                  <p className="text-gray-400 text-sm mb-2">
                    🏟 {hallName}
                  </p>
                  <p className="text-red-500 font-semibold mb-4">
                    💰 {s.price} ₽
                  </p>
                  <Link
                    to={`/tickets/${s.id}`}
                    className="block text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold transition"
                  >
                    Забронировать
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}