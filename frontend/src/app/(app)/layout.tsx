"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/contexts/identity/ui";
import { buildBreadcrumbs } from "@/contexts/navigation/breadcrumbs";
import { BreadcrumbLabelProvider, useBreadcrumbLabel } from "@/contexts/navigation/breadcrumbLabel";
import { supabase } from "@/lib/supabase";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbLabelProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </BreadcrumbLabelProvider>
  );
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [projectName, setProjectName] = useState<string | null>(null);
  const { entityLabel } = useBreadcrumbLabel();

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

  useEffect(() => {
    if (!projectId) {
      setProjectName(null);
      return;
    }
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        setProjectName(data?.name ?? null);
      });
  }, [projectId]);

  const breadcrumbs = isProjectRoute && projectName
    ? buildBreadcrumbs(pathname, projectName, entityLabel ?? undefined)
    : null;

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
            <>
              <Link
                href={`/project/${projectId}/spaces`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/spaces`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <span>Spaces</span>
              </Link>

              <Link
                href={`/project/${projectId}/asset-types`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/asset-types`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </span>
                <span>Asset Types</span>
              </Link>

              <Link
                href={`/project/${projectId}/systems`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/systems`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                </span>
                <span>Systems</span>
              </Link>

              <Link
                href={`/project/${projectId}/assets`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/assets`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18"/>
                    <path d="M3 9h18M9 3v18"/>
                  </svg>
                </span>
                <span>Assets</span>
              </Link>

              <Link
                href={`/project/${projectId}/test-procedure-templates`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/test-procedure-templates`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </span>
                <span>Test Procedure Templates</span>
              </Link>

              <Link
                href={`/project/${projectId}/members`}
                className={`bp-nav-item ${pathname.startsWith(`/project/${projectId}/members`) ? "bp-nav-active" : ""}`}
              >
                <span className="bp-nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <span>Members</span>
              </Link>
            </>
          )}
        </nav>

      </aside>

      <div className="bp-main">
        <div className="bp-topbar">
          <div className="bp-topbar-nav">
            <nav className="bp-breadcrumb">
              {pathname === "/inbox" && <span>Inbox</span>}
              {pathname === "/projects" && <span>All projects</span>}
              {breadcrumbs
                ? breadcrumbs.map((crumb, i) => (
                    <span key={i} className="bp-breadcrumb-item">
                      {i > 0 && <span className="bp-breadcrumb-sep">›</span>}
                      {crumb.href ? (
                        <Link href={crumb.href}>{crumb.label}</Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                    </span>
                  ))
                : isProjectRoute && <span>Project</span>}
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