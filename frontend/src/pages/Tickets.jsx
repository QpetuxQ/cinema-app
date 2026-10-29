import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Tickets() {
  const { id } = useParams(); // ID сеанса
  const { token, user } = useAuth();

  const [session, setSession] = useState(null);
  const [movie, setMovie] = useState(null);
  const [hall, setHall] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]); // [{row_number, seat_number}]
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================== Загрузка данных ====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const [sessions, movies, halls, tickets] = await Promise.all([
        fetch("http://127.0.0.1:8000/sessions").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/movies").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/halls").then((r) => r.json()),
        fetch(`http://127.0.0.1:8000/tickets/session/${id}`).then((r) => r.json()),
      ]);

      const sess = sessions.find((s) => s.id === parseInt(id));
      if (!sess) throw new Error("Сеанс не найден");

      const mov = movies.find((m) => m.id === sess.movie_id);
      const hal = halls.find((h) => h.id === sess.hall_id);

      setSession(sess);
      setMovie(mov);
      setHall(hal);
      setBookedSeats(tickets.map((t) => ({
        row_number: t.row_number,
        seat_number: t.seat_number
      })));
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ==================== Обработка выбора ====================
  const toggleSeat = (r, c) => {
    const key = `${r}-${c}`;
    setSelectedSeats((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  // ==================== Покупка ====================
  const handleBuy = async () => {
    if (!user) {
      alert("Пожалуйста, войдите, чтобы купить билет.");
      return;
    }

    try {
      for (const seat of selectedSeats) {
        const [row, col] = seat.split("-").map(Number);

        const res = await fetch("http://127.0.0.1:8000/tickets/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: session.id,
            row_number: row,
            seat_number: col,
          }),
        });

        if (!res.ok) {
          const msg = await res.text();
          console.error("Ошибка при бронировании:", msg);
          throw new Error(msg);
        }
      }

      alert("✅ Билеты успешно куплены!");
      setSelectedSeats([]);
      fetchData(); // обновляем зал
    } catch (err) {
      alert("Ошибка при бронировании 😞");
      console.error(err);
    }
  };

  // ==================== UI ====================
  if (loading)
    return <div className="text-center text-gray-400 py-20">Загрузка...</div>;

  if (!session || !hall)
    return (
      <div className="text-center text-red-500 py-20">
        Ошибка загрузки данных
      </div>
    );

  const total = selectedSeats.length * session.price;

  // ==================== Рендер ====================
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-h-screen pt-24 px-8">
      <div className="max-w-5xl mx-auto">
        {/* 🎬 Информация о фильме */}
        <div className="flex flex-col md:flex-row gap-8 mb-10 items-center md:items-start">
          <img
            src={movie.poster ? `http://127.0.0.1:8000${movie.poster}` : "/no-poster.png"}
            alt={movie.title}
            className="w-52 h-72 object-cover rounded-lg shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
            <p className="text-gray-400 mb-1">🏟 {hall.name}</p>
            <p className="text-gray-400 mb-1">
              🕒{" "}
              {new Date(session.date_time).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-gray-400">💰 {session.price} ₽ / место</p>
          </div>
        </div>

        {/* 🎥 Экран */}
        <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center mb-10 shadow-xl">
          <div className="bg-yellow-500 text-black font-bold px-8 py-2 rounded-t-lg mb-4 shadow-md">
            ЭКРАН
          </div>

          {/* 🪑 Схема зала */}
          <div className="space-y-3">
            {hall.seats.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-2 items-center">
                <span className="text-sm text-gray-400 w-5 text-right">{rIdx + 1}</span>
                {row.map((_, cIdx) => {
                  const key = `${rIdx + 1}-${cIdx + 1}`;
                  const booked = bookedSeats.some(
                    (t) =>
                      t.row_number === rIdx + 1 &&
                      t.seat_number === cIdx + 1
                  );
                  const selected = selectedSeats.includes(key);

                  return (
                    <button
                      key={key}
                      disabled={booked}
                      onClick={() => toggleSeat(rIdx + 1, cIdx + 1)}
                      className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-200 shadow-sm
                        ${booked
                          ? "bg-gray-700 cursor-not-allowed text-gray-500"
                          : selected
                            ? "bg-green-400 text-black scale-110"
                            : "bg-gray-500 hover:bg-yellow-400 hover:text-black"
                        }`}
                      title={`Ряд ${rIdx + 1}, Место ${cIdx + 1}`}
                    >
                      {cIdx + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 🧾 Легенда */}
          <div className="flex justify-center gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded" /> Свободно
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded" /> Выбрано
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700 rounded" /> Занято
            </div>
          </div>

          {/* 💰 Покупка */}
          <div className="mt-8 text-center">
            <p className="text-lg mb-2">
              💺 Выбрано мест:{" "}
              <span className="text-yellow-400 font-semibold">
                {selectedSeats.length}
              </span>
            </p>
            <p className="text-xl mb-4">
              💰 Итого:{" "}
              <span className="font-bold text-green-400">{total.toFixed(2)} ₽</span>
            </p>

            <button
              onClick={handleBuy}
              disabled={!selectedSeats.length}
              className={`px-8 py-3 rounded-md font-semibold transition ${selectedSeats.length
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              Купить билеты
            </button>

            {!user && (
              <p className="text-sm text-gray-400 mt-3">
                🔒 Чтобы купить билеты,{" "}
                <span className="text-red-500 font-semibold">войдите в аккаунт</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}