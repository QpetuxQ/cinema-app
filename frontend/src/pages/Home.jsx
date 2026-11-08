import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { getMovies, getSessions } from "../api/index";

const API = "http://127.0.0.1:8000";

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const rowLabel = (n) => (n <= 26 ? String.fromCharCode(64 + n) : String(n));
const posterUrl = (p) => (p ? `${API}${p}` : "https://placehold.co/300x320?text=No+Poster");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const softChip =
  "rounded-full border border-black/5 bg-surface px-4 py-1.5 text-xs font-medium text-black/60";

export default function Home() {
  const { user, token } = useAuth();
  const [params] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(() => dateKey(new Date()));
  const [movieId, setMovieId] = useState(null);
  const [hallId, setHallId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [search, setSearch] = useState("");

  const [booked, setBooked] = useState({ sid: null, list: [] });
  const [sel, setSel] = useState({ sid: null, seats: [] });
  const [reload, setReload] = useState(0);
  const [buying, setBuying] = useState(false);
  const [notice, setNotice] = useState(null);

  // ---------- загрузка данных ----------
  useEffect(() => {
    Promise.all([getMovies(), getSessions(), fetch(`${API}/halls`).then((r) => r.json())])
      .then(([m, s, h]) => {
        setMovies(m);
        setHalls(h);
        const upcoming = s.filter((x) => new Date(x.date_time).getTime() > Date.now());
        setSessions(upcoming);

        // ссылка вида /?session=5 открывает нужный сеанс
        const target = upcoming.find((x) => x.id === Number(params.get("session")));
        if (target) {
          setDate(dateKey(new Date(target.date_time)));
          setMovieId(target.movie_id);
          setHallId(target.hall_id);
          setSessionId(target.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- производные значения (выбор «по умолчанию» без эффектов) ----------
  const days = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    []
  );

  const sessionsOfDay = sessions.filter((s) => dateKey(new Date(s.date_time)) === date);
  const movieIdsOfDay = new Set(sessionsOfDay.map((s) => s.movie_id));

  const q = search.trim().toLowerCase();
  const visibleMovies = movies
    .filter((m) => m.title.toLowerCase().includes(q))
    .sort((a, b) => Number(movieIdsOfDay.has(b.id)) - Number(movieIdsOfDay.has(a.id)));

  const activeMovieId = movieIdsOfDay.has(movieId)
    ? movieId
    : movies.find((m) => movieIdsOfDay.has(m.id))?.id ?? null;
  const activeMovie = movies.find((m) => m.id === activeMovieId);

  const movieSessions = sessionsOfDay
    .filter((s) => s.movie_id === activeMovieId)
    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
  const hallIds = [...new Set(movieSessions.map((s) => s.hall_id))];
  const activeHallId = hallIds.includes(hallId) ? hallId : hallIds[0] ?? null;
  const hall = halls.find((h) => h.id === activeHallId);

  const hallSessions = movieSessions.filter((s) => s.hall_id === activeHallId);
  const activeSession = hallSessions.find((s) => s.id === sessionId) ?? hallSessions[0] ?? null;
  const activeSessionId = activeSession?.id ?? null;

  const bookedList = booked.sid === activeSessionId ? booked.list : [];
  const selectedSeats = sel.sid === activeSessionId ? sel.seats : [];

  // ---------- занятые места выбранного сеанса ----------
  useEffect(() => {
    if (!activeSessionId) return;
    let cancelled = false;
    fetch(`${API}/tickets/session/${activeSessionId}`)
      .then((r) => r.json())
      .then((t) => {
        if (!cancelled)
          setBooked({
            sid: activeSessionId,
            list: t.map((x) => `${x.row_number}-${x.seat_number}`),
          });
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, reload]);

  // ---------- действия ----------
  const toggleSeat = (key) =>
    setSel((prev) => {
      const base = prev.sid === activeSessionId ? prev.seats : [];
      return {
        sid: activeSessionId,
        seats: base.includes(key) ? base.filter((k) => k !== key) : [...base, key],
      };
    });

  const buy = async () => {
    if (!user) {
      setNotice({ type: "login" });
      return;
    }
    setBuying(true);
    setNotice(null);
    let bought = 0;
    try {
      for (const key of selectedSeats) {
        const [row, col] = key.split("-").map(Number);
        const res = await fetch(`${API}/tickets/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ session_id: activeSession.id, row_number: row, seat_number: col }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(typeof err.detail === "string" ? err.detail : "Не удалось забронировать место");
        }
        bought++;
      }
      setNotice({ type: "ok", text: `Билеты куплены: ${bought}` });
    } catch (e) {
      setNotice({
        type: "error",
        text: bought ? `Куплено ${bought}, затем ошибка: ${e.message}` : e.message,
      });
    } finally {
      setSel({ sid: activeSessionId, seats: [] });
      setReload((n) => n + 1);
      setBuying(false);
    }
  };

  const labels = [...selectedSeats]
    .map((k) => k.split("-").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([r, c]) => `${rowLabel(r)}${c}`);
  const total = selectedSeats.length * (activeSession?.price ?? 0);

  const sessionRange = (s) => {
    const start = new Date(s.date_time);
    const end = new Date(start.getTime() + (activeMovie?.duration ?? 0) * 60000);
    return `${timeStr(start)} – ${timeStr(end)}`;
  };

  if (loading) return <p className="py-24 text-center text-black/50">Загрузка...</p>;

  return (
    <div className="space-y-5">
      {/* ===== Полоса дат ===== */}
      <div className="scrollbar-hide grid auto-cols-[minmax(84px,1fr)] grid-flow-col gap-3 overflow-x-auto">
        {days.map((d, i) => {
          const key = dateKey(d);
          const active = key === date;
          return (
            <button
              key={key}
              onClick={() => setDate(key)}
              className={`rounded-2xl px-3 py-3 text-center transition ${active ? "bg-lav-200" : "bg-white hover:bg-lav-100"
                }`}
            >
              <div className="text-xs text-black/60">
                {i === 0 ? "Сегодня" : cap(d.toLocaleDateString("ru-RU", { weekday: "short" }))}
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                {pad(d.getDate())}, {d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")}
              </div>
            </button>
          );
        })}
      </div>

      {/* ===== Заголовок и поиск ===== */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Фильмы</h1>
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input bg-transparent! pl-10!"
          />
        </div>
      </div>

      {/* ===== Три колонки ===== */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,330px)_minmax(0,1fr)_minmax(280px,340px)]">
        {/* --- Афиши --- */}
        <section className="flex flex-col gap-3">
          <div className="scrollbar-hide grid max-h-[560px] grid-cols-2 gap-3 overflow-y-auto p-1">
            {visibleMovies.length === 0 && (
              <p className="col-span-2 py-10 text-center text-sm text-black/50">Ничего не найдено</p>
            )}
            {visibleMovies.map((m) => {
              const active = m.id === activeMovieId;
              const hasShows = movieIdsOfDay.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => setMovieId(m.id)}
                  title={hasShows ? m.title : `${m.title} — на эту дату сеансов нет`}
                  className={`relative aspect-[1/1.05] overflow-hidden rounded-2xl bg-lav-100 text-left transition ${active ? "ring-2 ring-lav-400 ring-offset-2 ring-offset-surface" : ""
                    } ${hasShows ? "" : "opacity-40"}`}
                >
                  <img
                    src={posterUrl(m.poster)}
                    alt={m.title}
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium leading-tight text-white">
                    {m.title}
                  </span>
                </button>
              );
            })}
          </div>
          <Link to="/movies" className="btn-dark w-full">
            Все фильмы
          </Link>
        </section>

        {/* --- Схема зала --- */}
        <section className="card flex min-h-[560px] flex-col p-6!">
          <h2 className="text-center text-[15px] font-semibold">Выберите место</h2>

          {activeSession && hall ? (
            <>
              <div className="mx-auto mt-6 h-10 w-[85%] rounded-t-[50%] border-t border-black/20 bg-gradient-to-b from-black/[0.05] to-transparent" />

              <div className="mt-6 overflow-x-auto pb-2">
                <div className="mx-auto w-fit space-y-2">
                  {(hall.seats || []).map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-center gap-2">
                      {row.map((type, cIdx) => {
                        const r = rIdx + 1;
                        const c = cIdx + 1;
                        const key = `${r}-${c}`;
                        if (type === "blocked") return <span key={key} className="h-10 w-[34px]" />;

                        const taken = bookedList.includes(key);
                        const picked = selectedSeats.includes(key);

                        let style = "bg-ink text-white hover:bg-lav-400";
                        if (type === "vip") style += " ring-2 ring-lav-300 ring-offset-1";
                        if (picked) style = "bg-lav-200 text-ink";
                        if (taken) style = "seat-taken cursor-not-allowed text-black/25";

                        return (
                          <button
                            key={key}
                            disabled={taken}
                            onClick={() => toggleSeat(key)}
                            title={`Ряд ${r}, место ${c}${type === "vip" ? " (VIP)" : ""}`}
                            className={`flex h-10 w-[34px] flex-col items-center justify-center rounded-lg text-[10px] font-semibold leading-tight transition ${style}`}
                          >
                            <span>{rowLabel(r)}</span>
                            <span>{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="text-center text-[15px] font-semibold">
                  {selectedSeats.length > 0
                    ? `Выбрано мест: ${selectedSeats.length}`
                    : "Выберите места на схеме"}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-5 text-xs text-black/55">
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded bg-ink" /> Свободно
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded bg-ink ring-2 ring-lav-300 ring-offset-1" /> VIP
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded bg-lav-200" /> Выбрано
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="seat-taken h-3.5 w-3.5 rounded" /> Занято
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="m-auto max-w-xs text-center text-sm text-black/50">
              На выбранную дату сеансов нет. Выберите другой день в полосе сверху.
            </p>
          )}
        </section>

        {/* --- Фильм, сеанс, цена --- */}
        <aside className="space-y-4">
          <div className="card p-5!">
            {activeMovie ? (
              <>
                <h2 className="text-[15px] font-semibold">{activeMovie.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(activeMovie.genre || "")
                    .split(",")
                    .map((g) => g.trim())
                    .filter(Boolean)
                    .map((g) => (
                      <span key={g} className={softChip}>
                        {g}
                      </span>
                    ))}
                  {activeMovie.duration && <span className={softChip}>{activeMovie.duration} мин</span>}
                  {activeMovie.age_rating && <span className={softChip}>{activeMovie.age_rating}</span>}
                </div>
              </>
            ) : (
              <p className="text-sm text-black/50">Фильм не выбран</p>
            )}
          </div>

          <div className="card p-5!">
            <h3 className="text-[15px] font-semibold">Выберите сеанс</h3>

            <div className="relative mt-4 border-b border-black/10">
              <select
                value={activeHallId ?? ""}
                onChange={(e) => {
                  setHallId(Number(e.target.value));
                  setSessionId(null);
                }}
                disabled={!hallIds.length}
                className="w-full cursor-pointer appearance-none bg-transparent py-2 pr-8 text-sm outline-none disabled:cursor-default"
              >
                {hallIds.length === 0 && <option value="">Нет сеансов</option>}
                {hallIds.map((id) => (
                  <option key={id} value={id}>
                    {halls.find((h) => h.id === id)?.name || `Зал ${id}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {hallSessions.map((s) => {
                const active = s.id === activeSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSessionId(s.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${active
                        ? "border-transparent bg-lav-200"
                        : "border-black/5 bg-surface text-black/60 hover:bg-lav-100"
                      }`}
                  >
                    {sessionRange(s)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5!">
            <h3 className="text-[15px] font-semibold">Стоимость</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-black/60">Билеты ({selectedSeats.length})</dt>
                <dd className="text-right font-medium">{labels.join(", ") || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/60">Цена за место</dt>
                <dd className="font-medium">{activeSession ? `${activeSession.price} ₽` : "—"}</dd>
              </div>
            </dl>
            <div className="my-4 border-t border-black/10" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Итого</span>
              <span>{total.toFixed(2)} ₽</span>
            </div>
          </div>

          {notice && (
            <p
              className={`rounded-2xl px-4 py-2.5 text-center text-sm ${notice.type === "ok"
                  ? "bg-lav-100 text-ink"
                  : notice.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-white text-black/70"
                }`}
            >
              {notice.type === "login" ? (
                <>
                  Чтобы купить билеты,{" "}
                  <Link to="/login" className="font-semibold underline underline-offset-4">
                    войдите в аккаунт
                  </Link>
                </>
              ) : (
                notice.text
              )}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSel({ sid: activeSessionId, seats: [] })}
              disabled={!selectedSeats.length}
              className="btn-lav"
            >
              Сбросить
            </button>
            <button onClick={buy} disabled={!selectedSeats.length || buying} className="btn-dark">
              {buying ? "Покупаем..." : "Купить"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}