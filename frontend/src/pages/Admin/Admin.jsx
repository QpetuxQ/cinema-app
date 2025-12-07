import { useState } from "react";
import AdminSidebar from "../Admin/AdminSlideBar";
import MoviesAdmin from "../Admin/MoviesAdmin";
import SessionsAdmin from "../Admin/SessionsAdmin";
import HallsAdmin from "../Admin/HallsAdmin";
import PosterUpload from "../Admin/PosterUpload";

export default function AdminDashboard() {
  const [section, setSection] = useState("movies");

  const renderSection = () => {
    switch (section) {
      case "movies":
        return <MoviesAdmin />;
      case "sessions":
        return <SessionsAdmin />;
      case "halls":
        return <HallsAdmin />;
      case "posters":
        return <PosterUpload />;
      default:
        return <MoviesAdmin />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Левая панель */}
      <AdminSidebar section={section} setSection={setSection} />

      {/* Основная часть */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}