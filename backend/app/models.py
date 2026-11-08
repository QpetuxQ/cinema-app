from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" / "admin"

    tickets = relationship("Ticket", back_populates="user")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    duration = Column(Integer)  # минуты
    age_rating = Column(String)
    genre = Column(String)
    poster = Column(String, nullable=True)

    sessions = relationship("Session", back_populates="movie")

class Hall(Base):
    __tablename__ = "halls"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    seats = Column(String, nullable=False)  # JSON-строка с конфигурацией

    sessions = relationship("Session", back_populates="hall")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"))
    hall_id = Column(Integer, ForeignKey("halls.id"))
    date_time = Column(DateTime)
    price = Column(Float)  # 💰 добавляем цену

    movie = relationship("Movie", back_populates="sessions")
    hall = relationship("Hall", back_populates="sessions")
    tickets = relationship("Ticket", back_populates="session")

class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = (
        UniqueConstraint("session_id", "row_number", "seat_number", name="uq_ticket_seat"),
    )
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    seat_number = Column(Integer)
    row_number = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="booked")

    session = relationship("Session", back_populates="tickets")
    user = relationship("User", back_populates="tickets")