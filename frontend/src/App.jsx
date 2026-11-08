import "./App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";

import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Sessions from "./pages/Sessions";
import Tickets from "./pages/Tickets";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Register from "./pages/Register";
import MyTickets from "./pages/MyTickets";

function Layout() {
  const { pathname } = useLocation();

  // Админ-панель остаётся тёмной и на весь экран
  if (pathname.startsWith("/admin")) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-[1500px] px-4 pb-10 md:px-8">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/tickets/:id" element={<Tickets />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-tickets" element={<MyTickets />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}