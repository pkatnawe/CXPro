"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  const isProjectRoute = pathname.startsWith("/project/");
  const projectId = isProjectRoute ? pathname.split("/")[2] : null;

  return (
    <div className="bp-app">
      <aside className="bp-sidebar">
        <div className="bp-brand">
          <div className="bp-brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="7"/>
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M12 1v6M12 17v6M1 12h6M17 12h6"/>
            </svg>
          </div>
          <div>
            <div className="bp-brand-name">CX·PRO</div>
            <div className="bp-brand-sub">commissioning</div>
          </div>
        </div>

        <nav className="bp-nav">
          <Link
            href="/inbox"
            className={`bp-nav-item ${pathname === "/inbox" ? "bp-nav-active" : ""}`}
          >
            <span className="bp-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l9 6 9-6M3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8l9-4 9 4"/>
              </svg>
            </span>
            <span>Inbox</span>
          </Link>

          <Link
            href="/projects"
            className={`bp-nav-item ${pathname === "/projects" ? "bp-nav-active" : ""}`}
          >
            <span className="bp-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="9"/>
                <rect x="14" y="3" width="7" height="5"/>
                <rect x="14" y="12" width="7" height="9"/>
                <rect x="3" y="16" width="7" height="5"/>
              </svg>
            </span>
            <span>Projects</span>
          </Link>

          {isProjectRoute && projectId && (
            <Link
              href={`/project/${projectId}/equipment`}
              className={`bp-nav-item ${pathname.includes("/equipment") ? "bp-nav-active" : ""}`}
            >
              <span className="bp-nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18"/>
                  <path d="M3 9h18M9 3v18"/>
                </svg>
              </span>
              <span>Equipment</span>
            </Link>
          )}
        </nav>

      </aside>

      <div className="bp-main">
        <div className="bp-topbar">
          <div className="bp-topbar-nav">
            <nav className="bp-breadcrumb">
              {pathname === "/inbox" && <span>Inbox</span>}
              {pathname === "/projects" && <span>All projects</span>}
              {isProjectRoute && <span>Project</span>}
            </nav>
          </div>
          
          <div className="bp-topbar-tools">
            <UserMenu projectId={projectId} theme={theme} onThemeChange={handleThemeChange} />
          </div>
        </div>

        <div className="bp-content">
          {children}
        </div>
      </div>
    </div>
  );
}