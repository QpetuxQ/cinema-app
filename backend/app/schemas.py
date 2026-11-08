from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime


# ------------------------
# Пользователь
# ------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    username: str = Field(
        min_length=3,
        max_length=32,
        pattern=r"^[A-Za-z0-9_]+$"
    )

    password: str = Field(
        min_length=8,
        max_length=64,
        pattern=r"^[A-Za-z0-9]+$"
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isalpha() for char in value):
            raise ValueError("Password must contain at least one letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit")

        return value

class RoleUpdate(BaseModel):
    role: Literal["user", "admin"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str   # при логине тоже


class User(UserBase):
    id: int
    role: str

    class Config:
        orm_mode = True


# ------------------------
# Токен
# ------------------------
class Token(BaseModel):
    access_token: str
    token_type: str


class MovieBase(BaseModel):
    title: str
    description: str | None = None
    duration: int
    genre: str | None = None
    age_rating: str | None = None
    poster: str | None = None  # <-- добавь сюда

class MovieCreate(MovieBase):
    pass


class Movie(MovieBase):
    id: int

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    movie_id: int
    hall_id: int
    date_time: datetime
    price: float  # 💰 добавили цену

class SessionCreate(SessionBase):
    pass

class SessionOut(SessionBase):
    id: int
    class Config:
        orm_mode = True



SeatType = Literal["regular", "vip", "blocked"]

class HallBase(BaseModel):
    name: str
    rows: int
    cols: int
    seats: List[List[SeatType]]

class HallCreate(HallBase):
    pass

class HallUpdate(HallBase):
    pass

class HallOut(HallBase):
    id: int

    class Config:
        orm_mode = True


# ------------------------
# Билеты
# ------------------------


class TicketBase(BaseModel):
    seat_number: int
    status: str = "booked"
    row_number: int

    class Config:
        orm_mode = True


class TicketCreate(BaseModel):
    session_id: int
    seat_number: int
    row_number: int


class Ticket(TicketBase):
    id: int
    session_id: int | None = None
    user_id: int | None = None  # NULL, если пользователь удалён

    class Config:
        orm_mode = True


class SessionShort(BaseModel):
    id: int
    date_time: datetime
    hall_id: int
    movie_id: int

    class Config:
        orm_mode = True


class TicketWithSession(Ticket):
    session: Optional[SessionShort] = None