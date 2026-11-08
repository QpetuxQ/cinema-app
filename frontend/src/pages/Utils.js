export const API = "http://127.0.0.1:8000";

export const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const timeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const rowLabel = (n) => (n <= 26 ? String.fromCharCode(64 + n) : String(n));
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const posterUrl = (p, size = "300x320") =>
    p ? `${API}${p}` : `https://placehold.co/${size}?text=No+Poster`;

// n ближайших дней, начиная с сегодняшнего
export const makeDays = (n = 10) =>
    Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

// «18:00 – 19:40»: начало и конец сеанса по длительности фильма
export const sessionRange = (dateTime, minutes = 0) => {
    const start = new Date(dateTime);
    const end = new Date(start.getTime() + minutes * 60000);
    return `${timeStr(start)} – ${timeStr(end)}`;
};

export const splitGenres = (genre) =>
    (genre || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

// общие классы
export const softChip =
    "rounded-full border border-black/5 bg-surface px-4 py-1.5 text-xs font-medium text-black/60";
export const timeChip =
    "rounded-full border border-black/5 bg-surface px-4 py-2 text-xs font-medium text-black/70 transition hover:bg-lav-200 hover:text-ink";