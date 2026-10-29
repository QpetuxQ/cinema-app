import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContextValue";
import { loginUser, registerUser, getCurrentUser } from "../api/index";


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      getCurrentUser(token)
        .then(setUser)
        .catch(() => logout());
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);

    const userData = await getCurrentUser(data.access_token);
    setUser(userData);
  };

  const register = async (username, email, password) => {
    await registerUser(username, email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};