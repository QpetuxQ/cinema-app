
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/tickets/:id" element={<Tickets />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;