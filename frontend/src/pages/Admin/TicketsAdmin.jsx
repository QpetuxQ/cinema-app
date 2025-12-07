import { useEffect, useState } from "react";

export default function TicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTickets)
      .catch(console.error);
  }, []);

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">🎟 Все билеты</h2>
      <div className="grid gap-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-gray-800 p-4 rounded-lg flex justify-between">
            <div>
              <p>🎬 Сеанс #{t.session_id}</p>
              <p>💺 Место {t.seat_number}</p>
              <p>👤 Пользователь ID: {t.user_id}</p>
            </div>
            <div className="text-red-400 font-semibold">{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}