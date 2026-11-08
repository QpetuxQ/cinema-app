import { Link } from "react-router-dom";
import { posterUrl } from "../pages/Utils";

// Плитка-афиша как на главной: скруглённая картинка с названием поверх
export default function MovieCard({ movie, to, subtitle, ratio = "aspect-[1/1.05]", className = "" }) {
    return (
        <Link
            to={to ?? `/movies/${movie.id}`}
            title={movie.title}
            className={`relative block overflow-hidden rounded-2xl bg-lav-100 transition hover:opacity-90 ${ratio} ${className}`}
        >
            <img
                src={posterUrl(movie.poster)}
                alt={movie.title}
                className="h-full w-full object-cover object-top"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium leading-tight text-white">
                <span className="line-clamp-2">{movie.title}</span>
                {subtitle && <span className="mt-0.5 block text-[10px] font-normal text-white/70">{subtitle}</span>}
            </span>
        </Link>
    );
}