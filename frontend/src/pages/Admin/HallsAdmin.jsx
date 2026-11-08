import { useEffect, useState } from "react";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

async function failMessage(res) {
  const err = await res.json().catch(() => ({}));
  return typeof err.detail === "string" ? err.detail : "Ошибка запроса";
}

export default function HallsAdmin() {
  const [halls, setHalls] = useState([]);
  const [form, setForm] = useState({ name: "", rows: "", cols: "" });
  const [editingHall, setEditingHall] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);

  // Загружаем залы при открытии
  useEffect(() => {
    fetch("http://127.0.0.1:8000/halls/")
      .then((r) => r.json())
      .then(setHalls)
      .catch(console.error);
  }, []);

  // Добавление нового зала
  const addHall = async (e) => {
    e.preventDefault();
    const rows = Number(form.rows);
    const cols = Number(form.cols);
    const seats = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "regular")
    );

    const res = await fetch("http://127.0.0.1:8000/halls/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...form, rows, cols, seats }),
    });
    if (!res.ok) return alert(await failMessage(res));
    const hall = await res.json();
    setHalls([...halls, hall]);
    setForm({ name: "", rows: "", cols: "" });
  };

  // Удаление
  const deleteHall = async (id) => {
    if (!window.confirm("Удалить этот зал?")) return;
    const res = await fetch(`http://127.0.0.1:8000/halls/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) return alert(await failMessage(res));
    setHalls(halls.filter((h) => h.id !== id));
  };

  // Редактирование
  const startEdit = (hall) => {
    setEditingHall(hall.id);
    setForm({ name: hall.name, rows: hall.rows, cols: hall.cols });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const rows = Number(form.rows);
    const cols = Number(form.cols);
    // бэкенд требует схему мест: оставляем прежнюю, если размер не менялся
    const current = halls.find((h) => h.id === editingHall);
    const sameSize = current && current.rows === rows && current.cols === cols;
    const seats = sameSize
      ? current.seats
      : Array.from({ length: rows }, () => Array.from({ length: cols }, () => "regular"));

    const res = await fetch(`http://127.0.0.1:8000/halls/${editingHall}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ name: form.name, rows, cols, seats }),
    });
    if (!res.ok) return alert(await failMessage(res));
    const updated = await res.json();
    setHalls(halls.map((h) => (h.id === editingHall ? updated : h)));
    setEditingHall(null);
    setForm({ name: "", rows: "", cols: "" });
  };

  // Клик по месту в визуальном редакторе
  const toggleSeat = (r, c) => {
    if (!selectedHall) return;
    const updatedSeats = selectedHall.seats.map((row, i) =>
      row.map((seat, j) => {
        if (i === r && j === c) {
          if (seat === "regular") return "vip";
          if (seat === "vip") return "blocked";
          if (seat === "blocked") return "regular";
        }
        return seat;
      })
    );
    setSelectedHall({ ...selectedHall, seats: updatedSeats });
  };

  // Сохранить конфигурацию мест
  const saveSeats = async () => {
    const res = await fetch(`http://127.0.0.1:8000/halls/${selectedHall.id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(selectedHall),
    });
    if (!res.ok) return alert(await failMessage(res));
    const updated = await res.json();
    setHalls(halls.map((h) => (h.id === selectedHall.id ? updated : h)));
    alert("✅ Конфигурация сохранена!");
  };

  // Отрисовка сетки
  const renderEditableGrid = (hall) => (
    <div className="flex flex-col items-center gap-1 mt-3">
      <div className="text-center text-sm text-gray-400 mb-1">Экран</div>
      <div className="bg-gray-600 h-1 w-3/4 mx-auto mb-3 rounded"></div>

      {hall.seats.map((row, r) => (
        <div key={r} className="flex justify-center gap-1">
          {row.map((seat, c) => {
            const color =
              seat === "regular"
                ? "bg-green-600"
                : seat === "vip"
                  ? "bg-blue-600"
                  : "bg-gray-500";
            return (
              <div
                key={`${r}-${c}`}
                className={`${color} w-6 h-6 rounded-sm cursor-pointer hover:opacity-80 transition`}
                onClick={() => toggleSeat(r, c)}
                title={`Ряд ${r + 1}, Место ${c + 1}`}
              ></div>
            );
          })}
        </div>
      ))}

      <div className="flex gap-3 mt-4">
        <button
          onClick={saveSeats}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-semibold"
        >
          💾 Сохранить конфигурацию
        </button>
        <button
          onClick={() => setSelectedHall(null)}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
        >
          ✖ Закрыть
        </button>
      </div>

      <div className="flex gap-4 text-sm text-gray-400 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-600 rounded-sm"></div> Обычное
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600 rounded-sm"></div> VIP
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-500 rounded-sm"></div> Недоступное
        </div>
      </div>
    </div>
  );

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">🏟 Управление залами</h2>

      {/* Форма */}
      <form
        onSubmit={editingHall ? saveEdit : addHall}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <input
          placeholder="Название зала"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-gray-800 px-4 py-2 rounded-md"
          required
        />
        <input
          type="number"
          placeholder="Рядов"
          value={form.rows}
          onChange={(e) => setForm({ ...form, rows: e.target.value })}
          className="bg-gray-800 px-4 py-2 rounded-md"
          required
        />
        <input
          type="number"
          placeholder="Мест в ряду"
          value={form.cols}
          onChange={(e) => setForm({ ...form, cols: e.target.value })}
          className="bg-gray-800 px-4 py-2 rounded-md"
          required
        />

        <button className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition">
          {editingHall ? "💾 Сохранить" : "➕ Добавить"}
        </button>
      </form>

      {/* Список залов */}
      <div className="grid gap-6">
        {halls.map((h) => (
          <div key={h.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-3">
              <div>
                🏟 <span className="font-semibold">{h.name}</span>
                <br />
                📏 {h.rows} рядов × {h.cols} мест
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedHall(h)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded-md font-semibold"
                >
                  🪑 Редактировать места
                </button>
                <button
                  onClick={() => startEdit(h)}
                  className="bg-blue-500 hover:bg-blue-400 text-black px-3 py-1 rounded-md font-semibold"
                >
                  ✏ Изменить зал
                </button>
                <button
                  onClick={() => deleteHall(h.id)}
                  className="bg-red-500 hover:bg-red-400 text-black px-3 py-1 rounded-md font-semibold"
                >
                  🗑 Удалить
                </button>
              </div>
            </div>

            {selectedHall?.id === h.id && renderEditableGrid(selectedHall)}
          </div>
        ))}
      </div>
    </div>
  );
}