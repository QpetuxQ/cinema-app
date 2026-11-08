import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-sm p-8!">
        <h2 className="mb-6 text-center text-xl font-semibold">Создать аккаунт</h2>

        {error && (
          <p className="mb-4 rounded-2xl bg-red-50 px-4 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
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
            placeholder="Пароль (8+ символов, буквы и цифры)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,64}"
            title="8–64 символа: латинские буквы и цифры, минимум одна буква и одна цифра"
            className="input"
          />

          <button type="submit" disabled={loading} className="btn-dark mt-3 w-full">
            {loading ? "Создаём..." : "Создать аккаунт"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-black/60">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-semibold text-ink underline underline-offset-4">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}