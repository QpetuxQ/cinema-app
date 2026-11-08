import json
from datetime import datetime
from types import SimpleNamespace

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas, database
from ..kafka_producer import publish_ticket_purchased
from .auth import get_current_user

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"]
)


# ✅ Купить билет
@router.post("/", response_model=schemas.Ticket)
def create_ticket(
    ticket: schemas.TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.Session).filter(models.Session.id == ticket.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сеанс не найден")

    if session.date_time <= datetime.now():
        raise HTTPException(status_code=400, detail="Сеанс уже начался или прошёл")

    # место должно существовать в зале и быть доступным
    hall = db.query(models.Hall).filter(models.Hall.id == session.hall_id).first()
    if not hall:
        raise HTTPException(status_code=400, detail="Для сеанса не найден зал")
    seats = json.loads(hall.seats)
    r, c = ticket.row_number, ticket.seat_number
    if not (1 <= r <= len(seats)) or not (1 <= c <= len(seats[r - 1])):
        raise HTTPException(status_code=400, detail="Такого места нет в зале")
    if seats[r - 1][c - 1] == "blocked":
        raise HTTPException(status_code=400, detail="Это место недоступно")

    existing = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.session_id == ticket.session_id,
            models.Ticket.row_number == ticket.row_number,
            models.Ticket.seat_number == ticket.seat_number
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Место уже занято")

    new_ticket = models.Ticket(
        session_id=ticket.session_id,
        seat_number=ticket.seat_number,
        row_number=ticket.row_number,
        user_id=current_user.id,
        status="booked"
    )

    db.add(new_ticket)
    try:
        db.commit()
    except IntegrityError:
        # два запроса одновременно купили одно место — второй проигрывает
        db.rollback()
        raise HTTPException(status_code=400, detail="Место уже занято")
    db.refresh(new_ticket)

    # снимок данных: к моменту фоновой задачи сессия БД уже закрыта
    event = SimpleNamespace(
        id=new_ticket.id,
        user_id=new_ticket.user_id,
        session_id=new_ticket.session_id,
        row_number=new_ticket.row_number,
        seat_number=new_ticket.seat_number,
        status=new_ticket.status,
    )
    # Kafka не должна задерживать ответ покупателю
    background_tasks.add_task(publish_ticket_purchased, event)

    return new_ticket


# ✅ Билеты текущего пользователя
@router.get("/me", response_model=List[schemas.TicketWithSession])
def get_my_tickets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    tickets = (
        db.query(models.Ticket)
        .options(joinedload(models.Ticket.session))  # <-- вот это ключ
        .filter(models.Ticket.user_id == current_user.id)
        .all()
    )
    return tickets


# ✅ Билеты по конкретному сеансу (без авторизации)
@router.get("/session/{session_id}", response_model=List[schemas.Ticket])
def get_tickets_by_session(session_id: int, db: Session = Depends(database.get_db)):
    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.session_id == session_id)
        .all()
    )
    return tickets


# ✅ Все билеты (только для админа)
@router.get("/", response_model=List[schemas.Ticket])
def get_all_tickets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")
    return db.query(models.Ticket).all()