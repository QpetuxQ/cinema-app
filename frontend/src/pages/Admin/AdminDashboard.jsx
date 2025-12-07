import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSlideBar";
import MoviesAdmin from "./MoviesAdmin";
import SessionsAdmin from "./SessionsAdmin";
import HallsAdmin from "./HallsAdmin";
import PosterUpload from "./PosterUpload";
import TicketsAdmin from "./TicketsAdmin";
import UsersAdmin from "./UsersAdmin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("movies");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // если не авторизован — выкидываем на логин
      return;
    }

    // проверяем роль
    fetch("http://127.0.0.1:8000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user) => {
        if (user.role !== "admin") {
          navigate("/"); // если не админ
        }
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  const sections = {
    movies: <MoviesAdmin />,
    sessions: <SessionsAdmin />,
    halls: <HallsAdmin />,
    tickets: <TicketsAdmin />,
    users: <UsersAdmin />,
    //posters: <PosterUpload />,
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <AdminSidebar section={section} setSection={setSection} />
      <main className="flex-1 overflow-y-auto p-8">{sections[section]}</main>
    </div>
  );
}