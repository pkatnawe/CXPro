"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/identity";

interface UserMenuProps {
  projectId: string | null;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export default function UserMenu({ projectId, theme, onThemeChange }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string | undefined>(undefined);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUserEmail(user.email || "");
        setFullName(user.user_metadata?.full_name);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const toggleTheme = () => {
    onThemeChange(theme === "light" ? "dark" : "light");
  };

  const initials = getInitials(fullName, userEmail);

  return (
    <div className="bp-user-menu" ref={dropdownRef}>
      <button
        className="bp-user"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <span>{initials}</span>
      </button>

      {isOpen && (
        <div className="bp-dropdown">
          <button
            onClick={toggleTheme}
            className="bp-dropdown-item"
          >
            <span className="bp-dropdown-icon">
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>
                </svg>
              )}
            </span>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>

          <Link
            href="/organization"
            className="bp-dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="bp-dropdown-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18"/>
                <path d="M5 21V7l7-4 7 4v14"/>
                <path d="M9 21v-6h6v6"/>
                <path d="M10 12h4"/>
                <path d="M10 8h4"/>
              </svg>
            </span>
            <span>Organization</span>
          </Link>

          {projectId && (
            <Link
              href={`/project/${projectId}/members`}
              className="bp-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <span className="bp-dropdown-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <span>Manage Team</span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="bp-dropdown-item"
          >
            <span className="bp-dropdown-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}