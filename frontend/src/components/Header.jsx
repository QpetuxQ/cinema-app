import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, ChevronDown, Clock, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/useAuth";

const pill =
  "flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, login, register } = useAuth();

  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const menuItems = [
    { to: "/", label: "Главная" },
    { to: "/movies", label: "Все фильмы" },
    { to: "/sessions", label: "Ближайшие сеансы" },
    ...(user ? [{ to: "/my-tickets", label: "Мои билеты" }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Админ-панель" }] : []),
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
      setError(err.message || "Не удалось войти");
    }
  };

  return (
    <>
      <header className="relative flex items-center justify-between gap-3 py-4">
        {/* Левая часть: меню, дата, время */}
        <div className="relative z-20 flex items-center gap-2">
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserOpen(false);
            }}
            aria-label="Меню"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white transition hover:bg-lav-100"
          >
            <Menu size={18} />
          </button>

          <span className={`${pill} hidden md:flex`}>
            <CalendarDays size={16} />
            {now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </span>
          <span className={`${pill} hidden md:flex`}>
            <Clock size={16} />
            {now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <nav className="absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-black/5 bg-white p-2 shadow-xl shadow-black/10">
                {menuItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-lav-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* Логотип по центру */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-3xl font-bold tracking-tight"
        >
          Cinema<span className="text-lav-400">TIX</span>
        </Link>

        {/* Пользователь */}
        <div className="relative z-20 flex items-center">
          {user ? (
            <>
              <button
                onClick={() => {
                  setUserOpen(!userOpen);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-black/5 bg-white py-1 pl-1 pr-3 text-sm font-medium"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lav-300 text-sm font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.username}</span>
                <ChevronDown size={16} className="text-black/50" />
              </button>

              {userOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-2xl border border-black/5 bg-white p-2 shadow-xl shadow-black/10">
                    <button
                      onClick={() => {
                        setUserOpen(false);
                        navigate("/my-tickets");
                      }}
                      className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition hover:bg-lav-100"
                    >
                      Мои билеты
                    </button>
                    <button
                      onClick={() => {
                        setUserOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-black/70 transition hover:bg-lav-100"
                    >
                      <LogOut size={15} /> Выйти
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button onClick={() => setShowModal(true)} className="btn-dark py-2!">
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Модальное окно входа / регистрации */}
      {showModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-surface p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-black/40 hover:bg-lav-100 hover:text-black"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>

            <h2 className="mb-6 text-center text-xl font-semibold">
              {isRegister ? "Создать аккаунт" : "Вход"}
            </h2>

            {error && (
              <p className="mb-4 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <input
                  type="text"
                  placeholder="Имя (латиница, цифры, _)"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  pattern="[A-Za-z0-9_]{3,32}"
                  title="3–32 символа: латинские буквы, цифры и _"
                  className="input"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input"
              />
              <input
                type="password"
                placeholder={isRegister ? "Пароль (8+ символов, буквы и цифры)" : "Пароль"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                {...(isRegister
                  ? {
                    pattern: "(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,64}",
                    title: "8–64 символа: латинские буквы и цифры, минимум одна буква и одна цифра",
                  }
                  : {})}
                className="input"
              />
              <button type="submit" className="btn-dark w-full">
                {isRegister ? "Создать аккаунт" : "Войти"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-black/60">
              {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="font-semibold text-ink underline underline-offset-4"
              >
                {isRegister ? "Войти" : "Создать"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}