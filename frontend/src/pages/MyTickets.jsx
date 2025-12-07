import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function MyTickets() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      if (!token) return;

      try {
        const [ticketsData, moviesData, hallsData] = await Promise.all([
          fetch("http://127.0.0.1:8000/tickets/me", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch("http://127.0.0.1:8000/movies").then((r) => r.json()),
          fetch("http://127.0.0.1:8000/halls").then((r) => r.json()),
        ]);

        setTickets(ticketsData);
        setMovies(moviesData);
        setHalls(hallsData);
      } catch (err) {
        console.error("Ошибка загрузки моих билетов:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [token]);

  const getMovie = (movieId) => movies.find((m) => m.id === movieId);
  const getHall = (hallId) => halls.find((h) => h.id === hallId);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        🔒 Пожалуйста, войдите в аккаунт, чтобы просмотреть свои билеты.
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        ⏳ Загрузка билетов...
      </div>
    );

  if (tickets.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400">
        <h2 className="text-2xl font-semibold mb-4">😕 У вас пока нет билетов</h2>
        <Link
          to="/sessions"
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-semibold transition"
        >
          🎟 Перейти к сеансам
        </Link>
      </div>
    );

  // 🕒 Разделяем на предстоящие и прошедшие
  const now = new Date();
  const upcoming = tickets
    .filter((t) => new Date(t.session?.date_time) > now)
    .sort((a, b) => new Date(a.session?.date_time) - new Date(b.session?.date_time));

  const past = tickets
    .filter((t) => new Date(t.session?.date_time) <= now)
    .sort((a, b) => new Date(b.session?.date_time) - new Date(a.session?.date_time));

  const TicketCard = ({ t, isPast }) => {
    const movie = getMovie(t.session?.movie_id);
    const hall = getHall(t.session?.hall_id);
    if (!movie || !hall) return null;

    return (
      <motion.div
        key={t.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`rounded-xl overflow-hidden shadow-lg border ${isPast ? "border-gray-800 bg-gray-900/70" : "border-gray-700 bg-gray-900"
          } hover:shadow-red-700/40 transition-all flex flex-col`}
      >
        {/* 🎞 Постер */}
        <img
          src={
            movie.poster
              ? `http://127.0.0.1:8000${movie.poster}`
              : "/no-poster.png"
          }
          alt={movie.title}
          className="w-full h-[260px] object-cover"
        />

        {/* 📋 Информация */}
        <div className="p-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-xl font-bold mb-1">{movie.title}</h3>
            <p className="text-gray-400 text-sm mb-1">
              🕒 {formatDate(t.session?.date_time)}
            </p>
            <p className="text-gray-400 text-sm mb-1">
              🏟 {hall.name || `Зал ${t.session?.hall_id}`}
            </p>
            <p className="text-gray-400 text-sm mb-3">
              💺 Место: <span className="text-yellow-400">{t.seat_number}</span>
            </p>
            <p className="text-gray-400 text-sm mb-3">
              💺 Ряд: <span className="text-yellow-400">{t.row_number}</span>
            </p>
            <p
              className={`text-sm font-semibold ${isPast ? "text-gray-500" : "text-green-400"
                }`}
            >
              {isPast ? "🎬 Сеанс завершён" : "✅ Забронирован"}
            </p>
          </div>

          <Link
            to={`/movies/${movie.id}`}
            className={`mt-4 py-2 rounded-md text-center font-semibold transition ${isPast
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700 text-white"
              }`}
          >
            🎬 К фильму
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen pt-24 px-10">
      <h1 className="text-4xl font-bold mb-10 border-l-4 border-red-600 pl-3">
        🎫 Мои билеты
      </h1>

      {/* 🔜 Предстоящие */}
      {upcoming.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-5 text-green-400">
            🔜 Предстоящие сеансы
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-12">
            {upcoming.map((t) => (
              <TicketCard key={t.id} t={t} isPast={false} />
            ))}
          </div>
        </>
      )}

      {/* ⏳ Прошедшие */}
      {past.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-5 text-gray-400">
            ⏳ Прошедшие сеансы
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {past.map((t) => (
              <TicketCard key={t.id} t={t} isPast={true} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}