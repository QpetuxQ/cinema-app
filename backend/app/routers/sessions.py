from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app import models, schemas, database
from backend.core.dependencies import get_current_admin

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _validate(db: Session, data: schemas.SessionCreate, exclude_id: int | None = None):
    """Фильм и зал существуют, зал в это время свободен."""
    movie = db.query(models.Movie).filter(models.Movie.id == data.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Фильм не найден")

    hall = db.query(models.Hall).filter(models.Hall.id == data.hall_id).first()
    if not hall:
        raise HTTPException(status_code=404, detail="Кинозал не найден")

    new_start = data.date_time
    new_end = new_start + timedelta(minutes=movie.duration)

    others = db.query(models.Session).filter(models.Session.hall_id == data.hall_id)
    if exclude_id is not None:
        others = others.filter(models.Session.id != exclude_id)

    for existing in others.all():
        existing_movie = db.query(models.Movie).filter(models.Movie.id == existing.movie_id).first()
        if not existing_movie:
            continue
        existing_end = existing.date_time + timedelta(minutes=existing_movie.duration)
        if new_start < existing_end and new_end > existing.date_time:
            raise HTTPException(status_code=409, detail="Кинозал уже занят в это время")


@router.post("/", response_model=schemas.SessionOut)
def create_session(
    session: schemas.SessionCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_current_admin),
):
    _validate(db, session)
    new_session = models.Session(**session.dict())
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/", response_model=list[schemas.SessionOut])
def get_sessions(db: Session = Depends(database.get_db)):
    return db.query(models.Session).all()


@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(session_id: int, db: Session = Depends(database.get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/{session_id}", response_model=schemas.SessionOut)
def update_session(
    session_id: int,
    data: schemas.SessionCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_current_admin),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # перенос сеанса в другой зал сломал бы уже проданные места
    if data.hall_id != session.hall_id and db.query(models.Ticket).filter(
        models.Ticket.session_id == session_id
    ).first():
        raise HTTPException(status_code=409, detail="На сеанс уже проданы билеты: зал менять нельзя")

    _validate(db, data, exclude_id=session_id)
    for field, value in data.dict().items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_current_admin),
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if db.query(models.Ticket).filter(models.Ticket.session_id == session_id).first():
        raise HTTPException(status_code=409, detail="Нельзя удалить сеанс: на него проданы билеты")

    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}