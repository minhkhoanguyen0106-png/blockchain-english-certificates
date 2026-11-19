import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ style = {} }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("certchain_theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("certchain_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        flexShrink: 0,
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.color = "var(--primary)";
        e.currentTarget.style.background = "var(--primary-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.color = "var(--text-secondary)";
        e.currentTarget.style.background = "transparent";
      }}
      title={`Chuyển sang ${theme === "dark" ? "Chế độ Sáng (Light)" : "Chế độ Tối (Dark)"}`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={17} color="#fbbf24" />
      ) : (
        <Moon size={17} color="#0284c7" />
      )}
    </button>
  );
}
