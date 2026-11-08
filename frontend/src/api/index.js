const API_URL = "http://127.0.0.1:8000"; // твой бекенд

// Бэкенд при ошибке валидации (422) отдаёт detail массивом, а не строкой
function formatError(detail, fallback) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const hints = {
      username: "Имя: 3–32 символа, только латиница, цифры и _",
      password: "Пароль: 8–64 символа, только латиница и цифры, минимум одна буква и одна цифра",
      email: "Введите корректный email",
    };
    const fields = [...new Set(detail.map((d) => d.loc?.[1]))];
    const msgs = fields.map((f) => hints[f]).filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  }
  return fallback;
}

// ======= MOVIES =======
export async function getMovies() {
  const response = await fetch(`${API_URL}/movies`);
  if (!response.ok) throw new Error("Ошибка загрузки фильмов");
  return response.json();
}

// ======= SESSIONS =======
export async function getSessions(movieId = null) {
  const url = movieId ? `${API_URL}/sessions/${movieId}` : `${API_URL}/sessions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Ошибка загрузки сеансов");
  return response.json();
}

// ======= AUTH =======
export async function login(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!response.ok) throw new Error("Ошибка авторизации");
  return response.json(); // возвращает токен
}

// ======= TICKETS =======
export async function getTickets(sessionId) {
  const response = await fetch(`${API_URL}/tickets/${sessionId}`);
  if (!response.ok) throw new Error("Ошибка загрузки билетов");
  return response.json();
}

export async function bookTicket(sessionId, seatNumber, token) {
  const response = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, seat_number: seatNumber }),
  });
  if (!response.ok) throw new Error("Ошибка бронирования билета");
  return response.json();
}


export async function uploadPoster(movieId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/movies/${movieId}/poster`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Ошибка при загрузке постера");
  return res.json();
}


export async function getHalls() {
  const response = await fetch("http://127.0.0.1:8000/halls");
  return await response.json();
}

export async function createHall(name, seats) {
  const response = await fetch("http://127.0.0.1:8000/halls?name=" + name + "&seats=" + seats, {
    method: "POST",
  });
  return await response.json();
}

export async function deleteHall(id) {
  const response = await fetch(`http://127.0.0.1:8000/halls/${id}`, { method: "DELETE" });
  return await response.json();
}

export async function updateHall(id, name, seats) {
  const response = await fetch(`http://127.0.0.1:8000/halls/${id}?name=${name}&seats=${seats}`, {
    method: "PUT",
  });
  return await response.json();
}


export async function getMovieById(id) {
  const res = await fetch(`http://127.0.0.1:8000/movies/${id}/`);
  if (!res.ok) throw new Error("Ошибка загрузки фильма");
  return res.json();
}


export async function registerUser(username, email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(formatError(err.detail, "Ошибка регистрации"));
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new Error("Неверный email или пароль");
  return res.json();
}

export async function getCurrentUser(token) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Ошибка получения данных пользователя");
  return res.json();
}