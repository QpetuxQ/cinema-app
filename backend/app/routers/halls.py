import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from backend.core.dependencies import get_current_admin

router = APIRouter(prefix="/halls", tags=["Halls"])


def _to_out(hall: models.Hall) -> dict:
    # не меняем ORM-объект: в колонке seats лежит JSON-строка
    return {
        "id": hall.id,
        "name": hall.name,
        "rows": hall.rows,
        "cols": hall.cols,
        "seats": json.loads(hall.seats),
    }


def _validate_grid(hall) -> None:
    if hall.rows < 1 or hall.cols < 1:
        raise HTTPException(status_code=422, detail="Рядов и мест должно быть не меньше 1")
    if len(hall.seats) != hall.rows or any(len(r) != hall.cols for r in hall.seats):
        raise HTTPException(status_code=422, detail="Схема мест не совпадает с rows × cols")


@router.get("/", response_model=list[schemas.HallOut])
def get_halls(db: Session = Depends(get_db)):
    return [_to_out(h) for h in db.query(models.Hall).order_by(models.Hall.id).all()]


@router.post("/", response_model=schemas.HallOut)
def create_hall(
    hall: schemas.HallCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    _validate_grid(hall)
    db_hall = models.Hall(
        name=hall.name, rows=hall.rows, cols=hall.cols, seats=json.dumps(hall.seats)
    )
    db.add(db_hall)
    db.commit()
    db.refresh(db_hall)
    return _to_out(db_hall)


@router.put("/{hall_id}", response_model=schemas.HallOut)
def update_hall(
    hall_id: int,
    hall: schemas.HallUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    db_hall = db.query(models.Hall).filter(models.Hall.id == hall_id).first()
    if not db_hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    _validate_grid(hall)
    db_hall.name = hall.name
    db_hall.rows = hall.rows
    db_hall.cols = hall.cols
    db_hall.seats = json.dumps(hall.seats)
    db.commit()
    db.refresh(db_hall)
    return _to_out(db_hall)


@router.delete("/{hall_id}")
def delete_hall(
    hall_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    hall = db.query(models.Hall).filter(models.Hall.id == hall_id).first()
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    if db.query(models.Session).filter(models.Session.hall_id == hall_id).first():
        raise HTTPException(status_code=409, detail="Нельзя удалить зал: в нём есть сеансы")
    db.delete(hall)
    db.commit()
    return {"ok": True}