import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getCurrentUser } from "../api/index";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // login(email, password) сам сохраняет токен и загружает пользователя
      await login(email, password);

      const user = await getCurrentUser(localStorage.getItem("token"));
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Не удалось войти. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8!">
        <h2 className="mb-6 text-center text-xl font-semibold">Вход</h2>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" className="btn-dark mt-6 w-full" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>

        <p className="mt-5 text-center text-sm text-black/60">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-semibold text-ink underline underline-offset-4">
            Создать
          </Link>
        </p>
      </form>
    </div>
  );
}