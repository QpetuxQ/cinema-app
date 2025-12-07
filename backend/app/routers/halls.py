from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from fastapi import Depends
import json

router = APIRouter(prefix="/halls", tags=["Halls"])

@router.get("/", response_model=list[schemas.HallOut])
def get_halls(db: Session = Depends(get_db)):
    halls = db.query(models.Hall).all()
    for h in halls:
        h.seats = json.loads(h.seats)
    return halls

@router.post("/", response_model=schemas.HallOut)
def create_hall(hall: schemas.HallCreate, db: Session = Depends(get_db)):
    db_hall = models.Hall(
        name=hall.name,
        rows=hall.rows,
        cols=hall.cols,
        seats=json.dumps(hall.seats)
    )
    db.add(db_hall)
    db.commit()
    db.refresh(db_hall)
    db_hall.seats = hall.seats
    return db_hall

@router.put("/{hall_id}", response_model=schemas.HallOut)
def update_hall(hall_id: int, hall: schemas.HallUpdate, db: Session = Depends(get_db)):
    db_hall = db.query(models.Hall).filter(models.Hall.id == hall_id).first()
    if not db_hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    db_hall.name = hall.name
    db_hall.rows = hall.rows
    db_hall.cols = hall.cols
    db_hall.seats = json.dumps(hall.seats)
    db.commit()
    db.refresh(db_hall)
    db_hall.seats = hall.seats
    return db_hall

@router.delete("/{hall_id}")
def delete_hall(hall_id: int, db: Session = Depends(get_db)):
    hall = db.query(models.Hall).filter(models.Hall.id == hall_id).first()
    if not hall:
        raise HTTPException(status_code=404, detail="Hall not found")
    db.delete(hall)
    db.commit()
    return {"ok": True}