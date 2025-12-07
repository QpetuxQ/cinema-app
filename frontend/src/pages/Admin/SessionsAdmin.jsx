import { useEffect, useState } from "react";
import { getMovies } from "../../api/index";

export default function SessionsAdmin() {
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tickets, setTickets] = useState([]); // 🔹 добавляем состояние для билетов
  const [form, setForm] = useState({
    movie_id: "",
    hall_id: "",
    date_time: "",
    price: "",
  });
  const [editing, setEditing] = useState(null);

  // 🔹 Загружаем фильмы, залы, сеансы и билеты
  useEffect(() => {
    getMovies().then(setMovies);

    fetch("http://127.0.0.1:8000/halls/")
      .then((r) => r.json())
      .then(setHalls)
      .catch(console.error);

    refreshSessions();
    refreshTickets();
  }, []);

  const refreshSessions = async () => {
    const res = await fetch("http://127.0.0.1:8000/sessions/");
    const data = await res.json();
    setSessions(data);
  };

  const refreshTickets = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("http://127.0.0.1:8000/tickets/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTickets(data);
  };

  // 🟢 Добавление или обновление
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.movie_id || !form.hall_id || !form.date_time || !form.price) {
      alert("❗ Заполните все поля!");
      return;
    }

    const payload = {
      movie_id: Number(form.movie_id),
      hall_id: Number(form.hall_id),
      date_time: form.date_time,
      price: Number(form.price),
    };

    const url = editing
      ? `http://127.0.0.1:8000/sessions/${editing.id}`
      : "http://127.0.0.1:8000/sessions/";

    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Ошибка: " + JSON.stringify(err.detail));
      return;
    }

    await refreshSessions();
    setForm({ movie_id: "", hall_id: "", date_time: "", price: "" });
    setEditing(null);
    alert(editing ? "✏ Сеанс обновлён!" : "✅ Сеанс создан!");
  };

  // ❌ Удалить
  const deleteSession = async (id) => {
    if (!window.confirm("Удалить этот сеанс?")) return;

    const res = await fetch(`http://127.0.0.1:8000/sessions/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSessions(sessions.filter((s) => s.id !== id));
      alert("🗑 Сеанс удалён!");
    } else {
      alert("Ошибка при удалении.");
    }
  };

  // ✏ Редактировать
  const startEdit = (s) => {
    setEditing(s);
    setForm({
      movie_id: s.movie_id,
      hall_id: s.hall_id,
      date_time: s.date_time.slice(0, 16),
      price: s.price,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ movie_id: "", hall_id: "", date_time: "", price: "" });
  };

  // 🧮 Подсчёт проданных мест
  const getSoldSeatsCount = (sessionId) => {
    return tickets.filter(
      (t) => t.session_id === sessionId && t.status === "booked"
    ).length;
  };

  const getTotalSeats = (hallId) => {
    const hall = halls.find((h) => h.id === hallId);
    if (!hall) return 0;
    return hall.rows * hall.cols;
  };

  // Получаем названия фильмов и залов
  const getMovieTitle = (id) => movies.find((m) => m.id === id)?.title || "—";
  const getHallName = (id) => halls.find((h) => h.id === id)?.name || "—";

  return (
    <div className="text-white">
      <h2 className="text-3xl font-bold text-yellow-400 mb-8 flex items-center gap-2">
        🕓 Управление сеансами
      </h2>

      {/* Форма */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
      >
        <select
          value={form.movie_id}
          onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
          className="bg-gray-900 px-4 py-2 rounded-md"
          required
        >
          <option value="">🎬 Фильм</option>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <select
          value={form.hall_id}
          onChange={(e) => setForm({ ...form, hall_id: e.target.value })}
          className="bg-gray-900 px-4 py-2 rounded-md"
          required
        >
          <option value="">🏟️ Зал</option>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.rows}×{h.cols})
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={form.date_time}
          onChange={(e) => setForm({ ...form, date_time: e.target.value })}
          className="bg-gray-900 px-4 py-2 rounded-md"
          required
        />

        <input
          type="number"
          placeholder="Цена ₽"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="bg-gray-900 px-4 py-2 rounded-md"
          required
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition w-full"
          >
            {editing ? "💾 Сохранить" : "➕ Добавить"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-500 transition"
            >
              ❌
            </button>
          )}
        </div>
      </form>

      {/* Список сеансов */}
      <div className="grid gap-6">
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-center py-10">
            ⚠️ Сеансов пока нет
          </p>
        ) : (
          sessions.map((s) => {
            const sold = getSoldSeatsCount(s.id);
            const total = getTotalSeats(s.hall_id);
            const percent = total ? Math.round((sold / total) * 100) : 0;

            return (
              <div
                key={s.id}
                className="bg-gray-800 p-5 rounded-lg flex justify-between items-center hover:bg-gray-700 transition"
              >
                <div>
                  <p className="font-bold text-lg text-yellow-400">
                    🎬 {getMovieTitle(s.movie_id)}
                  </p>
                  <p className="text-sm text-gray-300">
                    🏟 {getHallName(s.hall_id)}
                  </p>
                  <p className="text-sm text-gray-400">
                    🕒 {new Date(s.date_time).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">💰 {s.price} ₽</p>
                  <p className="text-sm text-gray-300 mt-1">
                    💺 Продано:{" "}
                    <span className="text-yellow-400 font-semibold">
                      {sold}
                    </span>{" "}
                    / {total} ({percent}%)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(s)}
                    className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-md font-semibold"
                  >
                    ✏ Редактировать
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md font-semibold"
                  >
                    🗑 Удалить
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}