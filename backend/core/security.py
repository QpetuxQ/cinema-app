from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Настройки токена
SECRET_KEY = "super_secret_key"  # ❗️поменяй на свой (лучше через .env)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Контекст для работы с паролями
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ------------------------
# Работа с паролями
# ------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка, совпадает ли пароль с хешем"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Генерация хеша из пароля"""
    return pwd_context.hash(password)


# ------------------------
# JWT токены
# ------------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Создание JWT токена"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Проверка и расшифровка токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None