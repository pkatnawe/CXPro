"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Accent = "azure" | "cobalt" | "copper" | "emerald";

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  accent: "azure",
  setTheme: () => {},
  setAccent: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState<Accent>("azure");

  useEffect(() => {
    const storedTheme = (localStorage.getItem("cxp.theme") as Theme) || "light";
    const storedAccent = (localStorage.getItem("cxp.accent") as Accent) || "azure";
    setThemeState(storedTheme);
    setAccentState(storedAccent);
    document.documentElement.setAttribute("data-theme", storedTheme);
    document.documentElement.setAttribute("data-accent", storedAccent);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("cxp.theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const setAccent = (a: Accent) => {
    setAccentState(a);
    localStorage.setItem("cxp.accent", a);
    document.documentElement.setAttribute("data-accent", a);
  };

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
