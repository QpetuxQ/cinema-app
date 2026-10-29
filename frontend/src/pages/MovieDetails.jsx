import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieById, getSessions } from "../api/index";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] // yyyy-mm-dd
  );


  useEffect(() => {
    Promise.all([
      getMovieById(id),
      getSessions(),
      fetch("http://127.0.0.1:8000/halls").then((r) => r.json()),
    ])
      .then(([movieData, sessionsData, hallsData]) => {
        setMovie(movieData);
        setHalls(hallsData);

        const now = new Date();
        const upcoming = sessionsData
          .filter((s) => s.movie_id === Number(id))
          .filter((s) => new Date(s.date_time) > now)
          .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

        setSessions(upcoming);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateTimeStr) => {
    const d = new Date(dateTimeStr);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🎬 Отбираем сеансы по выбранной дате
  const filteredSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date_time);
    const dateStr = sessionDate.toISOString().split("T")[0];
    return dateStr === selectedDate;
  });

  // 📆 Генерация ближайших 7 дней
  const generateDates = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Загрузка...
      </div>
    );

  if (!movie)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-400">
        Фильм не найден 😔
      </div>
    );

  return (
    <div className="bg-black text-white min-h-screen pt-20">
      {/* 🎥 HERO */}
      <div
        className="relative w-full h-[80vh] flex items-end"
        style={{
          backgroundImage: `url(${
            movie.poster ? `http://127.0.0.1:8000${movie.poster}` : "/no-poster.png"
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center px-12 pb-16 gap-10 max-w-6xl mx-auto">
          <img
            src={
              movie.poster
                ? `http://127.0.0.1:8000${movie.poster}`
                : "/no-poster.png"
            }
            alt={movie.title}
            className="w-[250px] md:w-[320px] rounded-xl shadow-2xl border border-gray-700"
          />

          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl font-extrabold leading-tight">
              {movie.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-gray-300 text-sm">
              {movie.genre && (
                <span className="bg-red-600 px-3 py-1 rounded-md">
                  {movie.genre}
                </span>
              )}
              {movie.duration && (
                <span className="bg-gray-800 px-3 py-1 rounded-md">
                  ⏱ {movie.duration} мин
                </span>
              )}
            </div>

            <p className="text-gray-300 text-lg leading-relaxed">
              {movie.description || "Описание отсутствует"}
            </p>

            <Link
              to="/movies"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition inline-block mt-6"
            >
              ← Назад к фильмам
            </Link>
          </div>
        </div>
      </div>

      {/* 🎟 Сеансы */}
      <div className="px-12 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 border-l-4 border-red-600 pl-3">
          🕓 Расписание сеансов
        </h2>

        {/* 📆 Календарь */}
        <div className="flex gap-4 mb-10 overflow-x-auto scrollbar-hide">
          {generateDates().map((d) => {
            const dateStr = d.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-5 py-3 rounded-lg text-center font-semibold transition whitespace-nowrap
                  ${
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <div className="text-lg">
                  {d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                </div>
                <div className="text-sm text-gray-400">
                  {d.toLocaleDateString("ru-RU", { weekday: "short" })}
                </div>
              </button>
            );
          })}
        </div>

        {/* 🪑 Сеансы */}
        {filteredSessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredSessions.map((session) => {
              const hall = halls.find((h) => h.id === session.hall_id);
              const hallInfo = hall ? `${hall.name}` : `Зал ${session.hall_id}`;
              return (
                <div
                  key={session.id}
                  className="bg-gray-900 hover:bg-gray-800 p-6 rounded-lg transition shadow-md border border-gray-800 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {formatDate(session.date_time)}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">
                      🏟 {hallInfo}
                    </p>
                    <p className="text-red-500 text-lg font-bold mb-4">
                      💰 {session.price} ₽
                    </p>
                  </div>

                  <Link
                    to={`/tickets/${session.id}`}
                     className="block w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold text-center transition"
                  >
                    Купить билет 🎟
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-lg mt-4">
            Нет доступных сеансов на выбранную дату 😞
          </p>
        )}
      </div>
    </div>
  );
}