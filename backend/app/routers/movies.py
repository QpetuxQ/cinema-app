from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
from backend.app import models, schemas, database
from backend.core.dependencies import get_current_user, get_current_admin
import os
import uuid

ALLOWED_POSTER_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(
    prefix="/movies",
    tags=["movies"]
)


@router.post("/", response_model=schemas.Movie)
def create_movie(
    movie: schemas.MovieCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    new_movie = models.Movie(**movie.dict())
    db.add(new_movie)
    db.commit()
    db.refresh(new_movie)
    return new_movie


@router.get("/", response_model=list[schemas.Movie])
def get_movies(db: Session = Depends(database.get_db)):
    return db.query(models.Movie).all()


@router.get("/{movie_id}", response_model=schemas.Movie)
def get_movie(movie_id: int, db: Session = Depends(database.get_db)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.put("/{movie_id}", response_model=schemas.Movie)
def update_movie(
    movie_id: int,
    movie_data: schemas.MovieCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # постер меняется только через POST /{id}/poster, иначе редактирование его стирает
    for field, value in movie_data.dict(exclude={"poster"}).items():
        setattr(movie, field, value)

    db.commit()
    db.refresh(movie)
    return movie


@router.delete("/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if db.query(models.Session).filter(models.Session.movie_id == movie_id).first():
        raise HTTPException(status_code=409, detail="Нельзя удалить фильм: для него есть сеансы")

    db.delete(movie)
    db.commit()
    return {"message": "Movie deleted"}

@router.post("/{movie_id}/poster")
async def upload_movie_poster(
    movie_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    ext = os.path.splitext(os.path.basename(file.filename or ""))[1].lower()
    if ext not in ALLOWED_POSTER_EXT:
        raise HTTPException(status_code=400, detail="Допустимы только изображения: jpg, png, webp, gif")

    os.makedirs("poster", exist_ok=True)
    filename = f"{movie_id}_{uuid.uuid4().hex}{ext}"  # имя от клиента не используем
    file_path = os.path.join("poster", filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    movie.poster = f"/poster/{filename}"
    db.commit()
    db.refresh(movie)

    return movie