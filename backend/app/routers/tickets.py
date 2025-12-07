from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"]
)


# ✅ Купить билет
@router.post("/", response_model=schemas.Ticket)
def create_ticket(
    ticket: schemas.TicketCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.Session).filter(models.Session.id == ticket.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сеанс не найден")

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
    db.commit()
    db.refresh(new_ticket)
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