"use client";

import { useState, useEffect } from "react";

const CORRECT_PASSWORD = "tfg123";
const STORAGE_KEY = "escrs_auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password);
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#f9fafb"
      }}>
        <div style={{ color: "#666" }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "400px",
          margin: "20px"
        }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#111" }}>
              ESCRS Clinical Trends Survey
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
              Please enter the password to continue
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "16px",
                border: error ? "2px solid #ef4444" : "2px solid #e5e7eb",
                borderRadius: "10px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              autoFocus
            />
            
            {error && (
              <div style={{ 
                color: "#ef4444", 
                fontSize: "14px", 
                marginTop: "8px",
                fontWeight: 600 
              }}>
                Incorrect password. Please try again.
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "transform 0.1s, box-shadow 0.1s"
              }}
            >
              Access Survey Data
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
