import { useEffect, useState } from "react";
import { getMovies } from "../../api/index";

export default function MoviesAdmin() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    genre: "",
    age_rating: "",
  });
  const [poster, setPoster] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null); // 🔹 текущее редактирование
  const token = localStorage.getItem("token");

  useEffect(() => {
    getMovies().then(setMovies);
  }, []);

  const refreshMovies = async () => {
    const data = await getMovies();
    setMovies(data); 
  };

  // ---------------------------
  // 🟢 Добавить или обновить фильм
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const movieData = {
        title: form.title,
        description: form.description || null,
        duration: Number(form.duration),
        genre: form.genre || null,
        age_rating: form.age_rating || null,
        poster: null,
      };

      const url = editingMovie
        ? `http://127.0.0.1:8000/movies/${editingMovie.id}`
        : "http://127.0.0.1:8000/movies/";

      const method = editingMovie ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(movieData),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Ошибка при сохранении фильма:", err);
        alert(`Ошибка: ${JSON.stringify(err.detail)}`);
        return;
      }

      const movie = await res.json();

      // 🔸 Загрузка постера, если выбран
      if (poster && movie?.id) {
        const formData = new FormData();
        formData.append("file", poster);

        const posterRes = await fetch(
          `http://127.0.0.1:8000/movies/${movie.id}/poster`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!posterRes.ok) console.warn("Ошибка при загрузке постера");
      }

      // Обновляем список фильмов
      await refreshMovies();

      setForm({
        title: "",
        description: "",
        duration: "",
        genre: "",
        age_rating: "",
      });
      setPoster(null);
      setEditingMovie(null);
      alert(editingMovie ? "✏️ Фильм обновлён!" : "✅ Фильм добавлен!");
    } catch (err) {
      console.error("Ошибка при сохранении фильма:", err);
      alert("Ошибка при сохранении фильма.");
    }
  };

  // ---------------------------
  // ❌ Удалить фильм
  // ---------------------------
  const deleteMovie = async (id) => {
    if (!window.confirm("Удалить этот фильм?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/movies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Ошибка: ${JSON.stringify(err.detail)}`);
        return;
      }

      setMovies(movies.filter((m) => m.id !== id));
      alert("🗑️ Фильм удалён");
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert("Ошибка при удалении фильма.");
    }
  };

  // ---------------------------
  // ✏️ Включить редактирование
  // ---------------------------
  const startEdit = (movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title,
      description: movie.description || "",
      duration: movie.duration || "",
      genre: movie.genre || "",
      age_rating: movie.age_rating || "",
    });
  };

  const cancelEdit = () => {
    setEditingMovie(null);
    setForm({
      title: "",
      description: "",
      duration: "",
      genre: "",
      age_rating: "",
    });
    setPoster(null);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
        🎬 Управление фильмами
      </h2>

      {/* Форма */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-md"
        />
        <input
          placeholder="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-md"
        />
        <input
          placeholder="Жанр (например, Комедия)"
          value={form.genre}
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-md"
        />
        <input
          placeholder="Возрастной рейтинг (например, 16+)"
          value={form.age_rating}
          onChange={(e) => setForm({ ...form, age_rating: e.target.value })}
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-md"
        />
        <input
          type="number"
          placeholder="Длительность (в минутах)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
          className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-md"
        />
        <input
          type="file"
          onChange={(e) => setPoster(e.target.files[0])}
          className="text-gray-300"
        />

        <div className="col-span-1 md:col-span-3 flex gap-4">
          <button
            type="submit"
            className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition"
          >
            {editingMovie ? "💾 Сохранить изменения" : "➕ Добавить фильм"}
          </button>

          {editingMovie && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-500 transition"
            >
              ❌ Отмена
            </button>
          )}
        </div>
      </form>

      {/* Список фильмов */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((m) => (
          <div
            key={m.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition hover:scale-[1.02]"
          >
            {m.poster ? (
              <img
                src={`http://127.0.0.1:8000${m.poster}`}
                alt={m.title}
                className="w-full h-64 object-cover object-center rounded-t-lg transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-700 text-gray-400">
                📷 Без постера
              </div>
            )}
            <div className="p-4 text-left space-y-2">
              <h3 className="text-xl font-semibold text-yellow-400 mb-1">
                {m.title}
              </h3>
              <p className="text-gray-300 text-sm mb-1">
                {m.genre} • {m.duration} мин
              </p>
              <p className="text-gray-400 text-sm">{m.age_rating}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(m)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-400"
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={() => deleteMovie(m.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-500"
                >
                  🗑️ Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}