"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/contexts/identity/api";
import { BreadcrumbLabelProvider, useBreadcrumbLabel } from "@/contexts/navigation/breadcrumbLabel";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbLabelProvider>
      <AppShell>{children}</AppShell>
    </BreadcrumbLabelProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProjectRoute = pathname.startsWith("/project/");
  const projectId = isProjectRoute ? pathname.split("/")[2] : null;
  const [projectName, setProjectName] = useState<string | null>(null);
  const { entityLabel } = useBreadcrumbLabel();

  useEffect(() => {
    if (!projectId) { setProjectName(null); return; }
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => setProjectName(data?.name ?? null));
  }, [projectId]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--ui-bg)", overflow: "hidden" }}>
      <LeftRail pathname={pathname} projectId={projectId} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar
          pathname={pathname}
          projectId={projectId}
          projectName={projectName}
          entityLabel={entityLabel}
        />
        <main style={{ flex: 1, overflowY: "auto", background: "var(--ui-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const RAIL_ITEMS = [
  {
    key: "assets",
    label: "Assets",
    href: (pid: string) => `/project/${pid}/assets`,
    match: (pathname: string, pid: string) => pathname.startsWith(`/project/${pid}/assets`),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
  },
  {
    key: "checklists",
    label: "Checklists",
    href: (pid: string) => `/project/${pid}/checklists`,
    match: (pathname: string, pid: string) => pathname.startsWith(`/project/${pid}/checklists`),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "asset-types",
    label: "Asset Types",
    href: (pid: string) => `/project/${pid}/asset-types`,
    match: (pathname: string, pid: string) => pathname.startsWith(`/project/${pid}/asset-types`),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: "spaces",
    label: "Spaces",
    href: (pid: string) => `/project/${pid}/spaces`,
    match: (pathname: string, pid: string) => pathname.startsWith(`/project/${pid}/spaces`),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "systems",
    label: "Systems",
    href: (pid: string) => `/project/${pid}/systems`,
    match: (pathname: string, pid: string) => pathname.startsWith(`/project/${pid}/systems`),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
];

const GHOST_ITEMS = [
  {
    key: "issues",
    label: "Issues",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: "drawings",
    label: "Drawings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    key: "reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={18} height={18}>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

function LeftRail({ pathname, projectId }: { pathname: string; projectId: string | null }) {
  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      background: "var(--ui-panel)",
      borderRight: "1px solid var(--ui-line)",
      height: "100%",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "16px 14px 14px",
        borderBottom: "1px solid var(--ui-line)",
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "var(--ui-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ui-on-primary)" strokeWidth="1.4" width={16} height={16}>
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 1v6M12 17v6M1 12h6M17 12h6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-ink)", letterSpacing: "0.04em" }}>CX·PRO</div>
          <div style={{ fontSize: 10, color: "var(--ui-ink-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>commissioning</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {projectId && RAIL_ITEMS.map((item) => {
          const active = item.match(pathname, projectId);
          return (
            <Link
              key={item.key}
              href={item.href(projectId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--ui-primary)" : "var(--ui-ink-soft)",
                background: active ? "var(--ui-primary-soft)" : "transparent",
                borderLeft: active ? "2px solid var(--ui-primary)" : "2px solid transparent",
                textDecoration: "none",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              <span style={{ color: active ? "var(--ui-primary)" : "var(--ui-ink-faint)" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {!projectId && (
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--ui-ink-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              No project selected
            </div>
          </div>
        )}

        {projectId && GHOST_ITEMS.length > 0 && (
          <div style={{ margin: "4px 0", borderTop: "1px solid var(--ui-line)", paddingTop: 4 }}>
            {GHOST_ITEMS.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  fontSize: 13,
                  color: "var(--ui-ink-faint)",
                  opacity: 0.5,
                  cursor: "default",
                  borderLeft: "2px solid transparent",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

function TopBar({
  pathname,
  projectId,
  projectName,
  entityLabel,
}: {
  pathname: string;
  projectId: string | null;
  projectName: string | null;
  entityLabel: string | null;
}) {
  const isProjectRoute = !!projectId;

  const title = (() => {
    if (projectName && isProjectRoute) return projectName;
    if (pathname === "/projects") return "All projects";
    if (pathname === "/organization") return "Organization";
    return null;
  })();

  return (
    <div style={{
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      background: "var(--ui-panel)",
      borderBottom: "1px solid var(--ui-line)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {title && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-ink)" }}>{title}</span>
        )}
        {entityLabel && (
          <>
            <span style={{ color: "var(--ui-ink-faint)", fontSize: 12 }}>›</span>
            <span style={{ fontSize: 13, color: "var(--ui-ink-soft)" }}>{entityLabel}</span>
          </>
        )}
      </div>
      <UserMenuDropdown projectId={projectId} />
    </div>
  );
}

const ACCENT_OPTIONS: { value: string; color: string }[] = [
  { value: "azure", color: "#2160e0" },
  { value: "cobalt", color: "#0050d4" },
  { value: "copper", color: "#b85c00" },
  { value: "emerald", color: "#1a7a45" },
];

function UserMenuDropdown({ projectId }: { projectId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState<string | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, accent, setTheme, setAccent } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (user && !error) {
        setUserEmail(user.email || "");
        setFullName(user.user_metadata?.full_name);
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const initials = getInitials(fullName, userEmail);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--ui-primary-soft)",
          border: "1px solid var(--ui-primary-line)",
          color: "var(--ui-primary)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "0.04em",
        }}
      >
        {initials}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          width: 220,
          background: "var(--ui-panel)",
          border: "1px solid var(--ui-line-strong)",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--ui-line)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-ink)" }}>{fullName || userEmail}</div>
            {fullName && <div style={{ fontSize: 11, color: "var(--ui-ink-faint)", marginTop: 1 }}>{userEmail}</div>}
          </div>

          <div style={{ padding: "4px 0" }}>
            <MenuLink href="/organization" onClick={() => setIsOpen(false)} icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            }>Organization</MenuLink>

            <MenuLink href="/projects" onClick={() => setIsOpen(false)} icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            }>Projects</MenuLink>

            {projectId && (
              <MenuLink href={`/project/${projectId}/members`} onClick={() => setIsOpen(false)} icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }>Team</MenuLink>
            )}
          </div>

          <div style={{ padding: "6px 12px 8px", borderTop: "1px solid var(--ui-line)" }}>
            <div style={{ fontSize: 11, color: "var(--ui-ink-faint)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>Appearance</div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "5px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ui-ink-soft)",
                fontSize: 13,
                textAlign: "left",
              }}
            >
              <span style={{ color: "var(--ui-ink-faint)" }}>
                {theme === "light" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                    <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                )}
              </span>
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>

            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAccent(opt.value as "azure" | "cobalt" | "copper" | "emerald")}
                  title={opt.value}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: opt.color,
                    border: accent === opt.value ? "2px solid var(--ui-ink)" : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ padding: "4px 0", borderTop: "1px solid var(--ui-line)" }}>
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ui-warn)",
                fontSize: 13,
                textAlign: "left",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={15} height={15}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        fontSize: 13,
        color: "var(--ui-ink-soft)",
        textDecoration: "none",
      }}
    >
      <span style={{ color: "var(--ui-ink-faint)" }}>{icon}</span>
      {children}
    </Link>
  );
}
