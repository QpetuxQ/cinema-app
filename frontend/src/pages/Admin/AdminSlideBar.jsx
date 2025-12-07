export default function AdminSidebar({ section, setSection }) {
  const menu = [
  { key: "movies", label: "🎬 Фильмы" },
  { key: "sessions", label: "🕓 Сеансы" },
  { key: "halls", label: "🏟 Залы" },
  { key: "tickets", label: "🎟 Билеты" },
  { key: "users", label: "👥 Пользователи" },
  //{ key: "posters", label: "🖼 Постеры" },
];

  return (
    <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
      <h1 className="text-3xl font-extrabold text-red-600 text-center py-8 border-b border-gray-800 tracking-wide">
        Admin<span className="text-white">Panel</span>
      </h1>

      <nav className="flex-1 p-4 space-y-3">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => setSection(item.key)}
            className={`w-full text-left px-5 py-3 rounded-md transition-all duration-200 text-lg ${
              section === item.key
                ? "bg-red-600 text-white font-bold shadow-md"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <footer className="p-4 text-center text-sm text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} CinemaApp
      </footer>
    </aside>
  );
}