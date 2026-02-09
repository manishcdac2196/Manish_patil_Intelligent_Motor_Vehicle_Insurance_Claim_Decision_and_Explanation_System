import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("imvc_user");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem("imvc_user", JSON.stringify(u));
    u.role === "company" ? navigate("/dashboard/company") : navigate("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("imvc_user");
    navigate("/sign-in");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
