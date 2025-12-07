from fastapi import FastAPI
from backend.app.routers import auth, movies, sessions, tickets, halls
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI(title="Cinema Booking API")

# Разрешаем фронтенду обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # фронтенд
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 👇 middleware для кэширования
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/poster/"):
            response.headers["Cache-Control"] = "public, max-age=86400"  # 1 день
        return response

# Подключаем middleware
app.add_middleware(CacheControlMiddleware)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(sessions.router)
app.include_router(tickets.router)
app.include_router(halls.router)
# Создаём директорию если нет
os.makedirs("poster", exist_ok=True)

# Раздаём статику
app.mount("/poster", StaticFiles(directory="poster"), name="poster")


@app.get("/")
def root():
    return {"message": "Cinema API is running 🚀"}