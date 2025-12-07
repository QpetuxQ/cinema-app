import './index.css'
import App from './App.jsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CinemaProvider } from "./context/CinemaContext.jsx";
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CinemaProvider>
        <App />
      </CinemaProvider>
    </AuthProvider>
  </StrictMode>,
)
