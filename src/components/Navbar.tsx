"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Command,
  Sun,
  Moon,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api, User as UserType } from "@/lib/api";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  onNewDocument?: () => void;
}

export default function Navbar({ onNewDocument }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    api.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
        className="sticky top-0 z-40 h-14"
      >
        <div className="max-w-screen-xl mx-auto h-full px-5 flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--accent)" }}
            >
              D
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--foreground)" }}>
              DocuSphere
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-sm mx-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all"
              style={{
                background: "var(--background)",
                border: "1.5px solid var(--border)",
                color: "var(--muted)",
                fontSize: "0.8125rem",
              }}
            >
              <Search size={14} />
              <span className="flex-1">Search documents…</span>
              <kbd
                className="hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                <Command size={10} />K
              </kbd>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {/* New doc */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNewDocument ?? (() => router.push("/editor/new"))}
              className="btn-primary hidden sm:inline-flex"
            >
              <Plus size={14} />
              New
            </motion.button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost w-9 h-9 justify-center p-0"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={theme}
                  initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0, rotate: 30 }}
                  transition={{ duration: 0.18 }}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Notifications */}
            <button className="btn-ghost w-9 h-9 justify-center p-0 relative">
              <Bell size={15} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            </button>

            {/* Avatar */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                style={{ color: "var(--foreground)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}
                >
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </div>
                <ChevronDown size={12} style={{ color: "var(--muted)" }} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 surface overflow-hidden z-50"
                  >
                    <div
                      className="px-3 py-2.5 border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    {[
                      { icon: User, label: "Profile" },
                      { icon: Settings, label: "Settings" },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all"
                        style={{ color: "var(--foreground)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--surface-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Icon size={14} style={{ color: "var(--muted)" }} />
                        {label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={async () => {
                          await api.auth.logout();
                          router.push("/login");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all"
                        style={{ color: "var(--danger)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--surface-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-lg mx-4 surface overflow-hidden"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <Search size={16} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--foreground)", fontFamily: "inherit" }}
                  placeholder="Search documents, pages, anything…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  ESC
                </kbd>
              </div>
              <div className="p-2">
                {["Getting Started Guide", "Q1 Planning Notes", "Product Roadmap", "Team Handbook"].map((doc) => (
                  <button
                    key={doc}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all"
                    style={{ color: "var(--foreground)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => {
                      setSearchOpen(false);
                      router.push("/editor/new");
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    >
                      📄
                    </div>
                    {doc}
                  </button>
                ))}
              </div>
              <div
                className="px-4 py-2 border-t flex items-center justify-between"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {searchQuery ? "Press Enter to search" : "Recent documents"}
                </span>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>↑↓</kbd>
                  navigate
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
