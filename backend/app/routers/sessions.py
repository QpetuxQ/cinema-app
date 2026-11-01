
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.app import models, schemas, database
from backend.app.routers.auth import get_current_user

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"]
)


# Создание сеанса только администратором
@router.post("/", response_model=schemas.SessionOut)
def create_session(
    session: schemas.SessionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав"
        )

    # Проверяем существование фильма
    movie = db.query(models.Movie).filter(
        models.Movie.id == session.movie_id
    ).first()

    if not movie:
        raise HTTPException(
            status_code=404,
            detail="Фильм не найден"
        )

    # Проверяем существование зала
    hall = db.query(models.Hall).filter(
        models.Hall.id == session.hall_id
    ).first()

    if not hall:
        raise HTTPException(
            status_code=404,
            detail="Кинозал не найден"
        )

    # Определяем окончание нового сеанса
    new_start = session.date_time
    new_end = new_start + timedelta(minutes=movie.duration)

    # Получаем существующие сеансы этого зала
    existing_sessions = (
        db.query(models.Session)
        .filter(models.Session.hall_id == session.hall_id)
        .all()
    )

    for existing in existing_sessions:
        existing_movie = db.query(models.Movie).filter(
            models.Movie.id == existing.movie_id
        ).first()

        if not existing_movie:
            continue

        existing_start = existing.date_time
        existing_end = existing_start + timedelta(
            minutes=existing_movie.duration
        )

        if new_start < existing_end and new_end > existing_start:
            raise HTTPException(
                status_code=409,
                detail="Кинозал уже занят в это время"
            )

    # Создаём сеанс
    new_session = models.Session(**session.dict())

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


# Получение всех сеансов
@router.get("/", response_model=list[schemas.SessionOut])
def get_sessions(db: Session = Depends(database.get_db)):
    return db.query(models.Session).all()


# Получение конкретного сеанса
@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(
    session_id: int,
    db: Session = Depends(database.get_db)
):
    session = db.query(models.Session).filter(
        models.Session.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return session


# Удаление сеанса только администратором
@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав"
        )

    session = db.query(models.Session).filter(
        models.Session.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    db.delete(session)
    db.commit()

    return {"message": "Session deleted"}
