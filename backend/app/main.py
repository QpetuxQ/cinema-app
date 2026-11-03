
import json
import logging
import os
import time
import uuid

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.routers import auth, movies, sessions, tickets, halls


# Настройка логирования
BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logger = logging.getLogger("cinema_api")
logger.setLevel(logging.INFO)
logger.propagate = False

if not logger.handlers:
    file_handler = logging.FileHandler(
        LOG_DIR / "app.log",
        encoding="utf-8"
    )
    file_handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(file_handler)


app = FastAPI(title="Cinema Booking API")


# Middleware для логирования HTTP-запросов
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    start_time = time.perf_counter()

    try:
        response = await call_next(request)
        status_code = response.status_code

    except Exception as exc:
        duration_ms = round(
            (time.perf_counter() - start_time) * 1000, 2
        )

        logger.error(json.dumps({
            "@timestamp": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
            ),
            "level": "ERROR",
            "message": "Unhandled application exception",
            "method": request.method,
            "path": request.url.path,
            "status_code": 500,
            "duration_ms": duration_ms,
            "request_id": request_id,
            "error_type": type(exc).__name__
        }, ensure_ascii=False))

        raise

    duration_ms = round(
        (time.perf_counter() - start_time) * 1000, 2
    )

    response.headers["X-Request-ID"] = request_id

    level = "WARNING" if status_code >= 400 else "INFO"

    logger.log(
        logging.WARNING if status_code >= 400 else logging.INFO,
        json.dumps({
            "@timestamp": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
            ),
            "level": level,
            "message": "HTTP request completed",
            "method": request.method,
            "path": request.url.path,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "request_id": request_id
        }, ensure_ascii=False)
    )

    return response


# Разрешаем фронтенду обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware для кэширования
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        if request.url.path.startswith("/poster/"):
            response.headers["Cache-Control"] = "public, max-age=86400"

        return response


app.add_middleware(CacheControlMiddleware)


# Подключаем роутеры
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(sessions.router)
app.include_router(tickets.router)
app.include_router(halls.router)


# Создаём директорию для постеров
os.makedirs("poster", exist_ok=True)

# Раздаём статические файлы
app.mount("/poster", StaticFiles(directory="poster"), name="poster")


@app.get("/")
def root():
    return {"message": "Cinema API is running"}
