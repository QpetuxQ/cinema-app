import { cap, dateKey, pad } from "./Utils";

// Полоса дат как на главной: выбранный день лавандовый
export default function DateStrip({ days, value, onChange }) {
    return (
        <div className="scrollbar-hide grid auto-cols-[minmax(84px,1fr)] grid-flow-col gap-3 overflow-x-auto">
            {days.map((d, i) => {
                const key = dateKey(d);
                const active = key === value;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
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
    );
}