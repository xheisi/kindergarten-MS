import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase
      .from("users")
      .select("id, username, role")
      .eq("username", username.trim())
      .eq("password", password)
      .single();

    setLoading(false);

    if (err || !data) {
      setError("Invalid username or password. Please try again.");
      return;
    }

    onLogin(data); // { id, username, role }
  }

  function onKey(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--white)",
        borderRadius: "var(--r)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        padding: "40px 36px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg,#F0715A,#F5A68A)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>Nestify</div>
            <div style={{ fontSize: 12, color: "var(--textm)", fontWeight: 500 }}>Management System</div>
          </div>
        </div>

        <div style={{ marginBottom: 28, marginTop: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--text)" }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>Sign in to your account to continue</p>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            onKeyDown={onKey}
            placeholder="Enter your username"
            autoFocus
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: `1.5px solid ${error ? "var(--red-t)" : "var(--border)"}`,
              fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none",
              background: "var(--bg)", color: "var(--text)", fontWeight: 600,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={onKey}
              placeholder="Enter your password"
              style={{
                width: "100%", padding: "10px 42px 10px 14px", borderRadius: 10,
                border: `1.5px solid ${error ? "var(--red-t)" : "var(--border)"}`,
                fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none",
                background: "var(--bg)", color: "var(--text)", fontWeight: 600,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                color: "var(--textm)", display: "flex", alignItems: "center",
              }}
            >
              {showPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--red-l)", color: "var(--red-t)",
            borderRadius: 8, padding: "9px 13px", fontSize: 13,
            fontWeight: 600, marginTop: 4, marginBottom: 4,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: 20, width: "100%", padding: "12px",
            background: "var(--salmon)", color: "white",
            border: "none", borderRadius: 12, fontSize: 15,
            fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Nunito', sans-serif", opacity: loading ? 0.7 : 1,
            transition: "opacity .15s",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--textm)", textAlign: "center" }}>
          Contact your administrator if you've forgotten your credentials.
        </p>
      </div>
    </div>
  );
}
