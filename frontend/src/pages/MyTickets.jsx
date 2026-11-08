import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { API, posterUrl, rowLabel, softChip } from "./Utils";

const when = (str) =>
  new Date(str).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function Empty({ title, text, action }) {
  return (
    <div className="card mx-auto max-w-md py-14 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-black/50">{text}</p>}
      {action}
    </div>
  );
}

// Один билет-карточка на сеанс: все купленные места собраны вместе
function TicketCard({ group, past }) {
  const { movie, hall, session, seats, price } = group;
  return (
    <FramerMotion.motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`card relative flex flex-col gap-4 p-4! sm:flex-row ${past ? "opacity-60" : ""}`}
    >
      <div className="h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-lav-100 sm:h-36 sm:w-32">
        <img src={posterUrl(movie.poster)} alt={movie.title} className="h-full w-full object-cover object-top" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[15px] font-semibold leading-snug">{movie.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`${softChip} inline-flex items-center gap-1.5`}>
            <CalendarDays size={12} /> {when(session.date_time)}
          </span>
          <span className={`${softChip} inline-flex items-center gap-1.5`}>
            <MapPin size={12} /> {hall?.name || `Зал ${session.hall_id}`}
          </span>
        </div>
        <Link
          to={`/movies/${movie.id}`}
          className="mt-auto pt-3 text-sm font-medium text-black/60 underline underline-offset-4 transition hover:text-black"
        >
          О фильме
        </Link>
      </div>

      {/* Отрывная часть билета */}
      <div className="relative border-t border-dashed border-black/15 pt-4 sm:w-48 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <span className="absolute -left-[10px] -top-[26px] hidden h-5 w-5 rounded-full bg-surface sm:block" />
        <span className="absolute -bottom-[26px] -left-[10px] hidden h-5 w-5 rounded-full bg-surface sm:block" />

        <p className="text-xs text-black/50">{seats.length > 1 ? `Места (${seats.length})` : "Место"}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {seats.map((s) => (
            <span
              key={s}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-xs font-semibold text-white"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-black/50">Итого</p>
        <p className="text-[15px] font-semibold">{price != null ? `${(price * seats.length).toFixed(2)} ₽` : "—"}</p>
        <span className={`${softChip} mt-3 inline-block ${past ? "" : "bg-lav-100!"}`}>
          {past ? "Сеанс прошёл" : "Забронирован"}
        </span>
      </div>
    </FramerMotion.motion.article>
  );
}

export default function MyTickets() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/tickets/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/movies`).then((r) => r.json()),
      fetch(`${API}/halls`).then((r) => r.json()),
      fetch(`${API}/sessions`).then((r) => r.json()),
    ])
      .then(([t, m, h, s]) => {
        setTickets(Array.isArray(t) ? t : []);
        setMovies(m);
        setHalls(h);
        setSessions(s);
      })
      .catch((err) => console.error("Ошибка загрузки моих билетов:", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user)
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold">Мои билеты</h1>
        <Empty
          title="Войдите, чтобы увидеть свои билеты"
          action={
            <Link to="/login" className="btn-dark mt-6">
              Войти
            </Link>
          }
        />
      </div>
    );

  // группируем билеты по сеансам
  const byKey = {};
  for (const t of tickets) {
    if (!t.session) continue;
    const g = (byKey[t.session.id] ||= { session: t.session, rows: [] });
    g.rows.push(t);
  }
  const groups = Object.values(byKey)
    .map(({ session, rows }) => ({
      session,
      movie: movies.find((m) => m.id === session.movie_id),
      hall: halls.find((h) => h.id === session.hall_id),
      price: sessions.find((s) => s.id === session.id)?.price ?? null,
      seats: rows
        .sort((a, b) => a.row_number - b.row_number || a.seat_number - b.seat_number)
        .map((t) => `${rowLabel(t.row_number)}${t.seat_number}`),
    }))
    .filter((g) => g.movie);

  const now = Date.now();
  const upcoming = groups
    .filter((g) => new Date(g.session.date_time).getTime() > now)
    .sort((a, b) => new Date(a.session.date_time) - new Date(b.session.date_time));
  const past = groups
    .filter((g) => new Date(g.session.date_time).getTime() <= now)
    .sort((a, b) => new Date(b.session.date_time) - new Date(a.session.date_time));

  const active = tab ?? (upcoming.length || !past.length ? "upcoming" : "past");
  const list = active === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Мои билеты</h1>

      <div className="flex gap-2">
        {[
          ["upcoming", "Предстоящие", upcoming.length],
          ["past", "Прошедшие", past.length],
        ].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${active === key ? "bg-lav-200" : "bg-white hover:bg-lav-100"
              }`}
          >
            {label} <span className="text-black/45">{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-20 text-center text-black/50">Загрузка билетов...</p>
      ) : list.length === 0 ? (
        <Empty
          title={active === "upcoming" ? "Предстоящих билетов нет" : "Прошедших билетов нет"}
          text={active === "upcoming" ? "Выберите фильм и сеанс на главной странице." : undefined}
          action={
            active === "upcoming" ? (
              <Link to="/" className="btn-dark mt-6">
                Выбрать сеанс
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((g) => (
            <TicketCard key={g.session.id} group={g} past={active === "past"} />
          ))}
        </div>
      )}
    </div>
  );
}