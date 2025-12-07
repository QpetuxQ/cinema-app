import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, login, register } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Главная" },
    { path: "/movies", label: "Фильмы" },
    { path: "/sessions", label: "Сеансы" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(form.username, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      setShowModal(false);
      setForm({ email: "", password: "", username: "" });
    } catch (err) {
      setError(err.message || "Ошибка входа");
    }
  };

  return (
    <>
      {/* 🔺 Навигация */}
      <header
        className={`fixed top-0 w-full z-50 transition-all ${scrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
          }`}
      >
        <nav className="flex items-center justify-between px-10 py-4">
          <Link
            to="/"
            className="text-red-600 text-3xl font-extrabold tracking-wide"
          >
            Cinema<span className="text-white">App</span>
          </Link>

          {/* 🔹 Навигация */}
          <ul className="flex space-x-8 text-gray-300 text-sm font-medium items-center">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`hover:text-white ${location.pathname === item.path ? "text-white" : ""
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {/* 🔸 Мои билеты (только для авторизованных) */}
            {user && (
              <li>
                <Link
                  to="/my-tickets"
                  className={`hover:text-white ${location.pathname === "/my-tickets" ? "text-white" : ""
                    }`}
                >
                  🎟 Мои билеты
                </Link>
              </li>
            )}

            {/* 🔸 Админ-панель */}
            {user?.role === "admin" && (
              <li>
                <button
                  onClick={() => navigate("/admin")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition"
                >
                  🛠 Админ-панель
                </button>
              </li>
            )}
          </ul>

          {/* 🔸 Правый угол */}
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-200 font-semibold">
                👤 {user.username}
              </span>
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition"
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold text-sm"
            >
              Вход
            </button>
          )}
        </nav>
      </header>

      {/* 🔻 Модальное окно входа/регистрации */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
          <div className="bg-gray-900 rounded-xl p-8 w-[400px] shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
              {isRegister ? "Создать аккаунт" : "Вход"}
            </h2>

            {error && (
              <p className="text-red-400 bg-red-900/30 p-2 rounded text-sm mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                  className="w-full bg-gray-800 px-4 py-2 rounded-md focus:ring-2 focus:ring-red-600 outline-none"
                />
              )}

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-gray-800 px-4 py-2 rounded-md focus:ring-2 focus:ring-red-600 outline-none"
              />

              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full bg-gray-800 px-4 py-2 rounded-md focus:ring-2 focus:ring-red-600 outline-none"
              />

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold transition"
              >
                {isRegister ? "Создать аккаунт" : "Войти"}
              </button>
            </form>

            <p className="text-center text-gray-400 mt-4 text-sm">
              {isRegister ? (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="text-red-500 hover:text-red-400 font-semibold"
                  >
                    Войти
                  </button>
                </>
              ) : (
                <>
                  Нет аккаунта?{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="text-red-500 hover:text-red-400 font-semibold"
                  >
                    Создайте
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}