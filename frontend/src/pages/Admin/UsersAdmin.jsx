import { useEffect, useState } from "react";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/auth/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, newRole) => {
    const res = await fetch(`http://127.0.0.1:8000/auth/${id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(typeof err.detail === "string" ? err.detail : "Не удалось сменить роль");
      return;
    }
    setUsers(
      users.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Удалить пользователя?")) return;
    const res = await fetch(`http://127.0.0.1:8000/auth/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(typeof err.detail === "string" ? err.detail : "Не удалось удалить пользователя");
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
  };

  if (loading) return <p className="text-gray-400">Загрузка...</p>;

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">👥 Пользователи</h2>
      <table className="w-full border-collapse bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700 text-left text-sm text-gray-300 uppercase">
            <th className="p-3">ID</th>
            <th className="p-3">Имя</th>
            <th className="p-3">Email</th>
            <th className="p-3">Роль</th>
            <th className="p-3">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-b border-gray-700 hover:bg-gray-750 transition"
            >
              <td className="p-3 text-gray-400">{u.id}</td>
              <td className="p-3">{u.username}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="bg-gray-900 text-white border border-gray-600 rounded-md px-2 py-1"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3">
                <button
                  onClick={() => deleteUser(u.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}