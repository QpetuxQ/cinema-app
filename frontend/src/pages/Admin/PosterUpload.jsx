import { useEffect, useState } from "react";
import { getMovies, uploadPoster } from "../../api/index";

export default function AdminPosterUpload() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMovies().then(setMovies).catch(console.error);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedMovie || !file) {
      setMessage("Выберите фильм и файл!");
      return;
    }

    try {
      const res = await uploadPoster(selectedMovie, file);
      setMessage(`✅ Успешно: ${res.poster_url}`);
    } catch (err) {
      setMessage("❌ Ошибка при загрузке");
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-gray-900 p-6 rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-yellow-400">
        🎬 Загрузка постера к фильму
      </h1>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block mb-2 text-gray-300">Выберите фильм:</label>
          <select
            className="w-full bg-gray-800 text-gray-100 px-4 py-2 rounded-md"
            value={selectedMovie}
            onChange={(e) => setSelectedMovie(e.target.value)}
          >
            <option value="">— Не выбрано —</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-gray-300">Выберите файл:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-gray-100"
          />
        </div>

        <button
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-md font-semibold w-full"
        >
          Загрузить
        </button>
      </form>

      {message && <p className="mt-4 text-center text-gray-200">{message}</p>}
    </div>
  );
}