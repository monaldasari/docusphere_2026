"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api, Document, User } from "@/lib/api";
import {
  Plus, Search, Star, StarOff, Trash2, Share2, MoreHorizontal,
  FileText, Clock, Grid3X3, List, LogOut, Settings, ChevronDown,
  File, Folder, Users, BarChart3, Sparkles, Copy, Check, X
} from "lucide-react";

type ViewMode = "grid" | "list";
type SortMode = "recent" | "name" | "created";
type FilterMode = "all" | "owned" | "shared" | "starred";

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("Untitled Document");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [userData, docs] = await Promise.all([
        api.auth.me(),
        api.documents.list(),
      ]);
      if (!userData) {
        router.push("/login");
        return;
      }
      const storedProfile = typeof window !== "undefined" ? localStorage.getItem("docusphere-user-profile") : null;
      const savedProfile = storedProfile ? JSON.parse(storedProfile) : null;
      setUser({ ...userData, avatarUrl: savedProfile?.avatarUrl || undefined });
      setDocuments(docs);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateDocument = async () => {
    setCreateTitle("Untitled Document");
    setCreateModalOpen(true);
  };

  const confirmCreateDocument = async () => {
    setCreating(true);
    try {
      const doc = await api.documents.create({
        title: createTitle.trim() || "Untitled Document",
        emoji: "📄",
      });
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const handleRename = (doc: Document) => {
    setRenameDocumentId(doc.id);
    setRenameTitle(doc.title);
    setRenameModalOpen(true);
    setContextMenu(null);
  };

  const handleDelete = async (id: string) => {
    await api.documents.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setContextMenu(null);
  };

  const handleStar = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    await api.documents.update(id, { starred: !doc.starred });
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, starred: !d.starred } : d))
    );
  };

  const handleShare = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    if (!doc.inviteToken) {
      const updated = await api.documents.update(id, { shared: true });
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      );
    }
    setShareModal(id);
    setContextMenu(null);
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/join/${token}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!shareModal || !inviteEmail) return;
    setInviting(true);
    setInviteMessage(null);
    try {
      await api.documents.addCollaborator(shareModal, inviteEmail);
      setInviteMessage({ type: "success", text: "Invitation sent successfully!" });
      setInviteEmail("");
    } catch (err: any) {
      setInviteMessage({ type: "error", text: err.message || "Failed to invite user" });
    } finally {
      setInviting(false);
      setTimeout(() => setInviteMessage(null), 3000);
    }
  };

  const confirmRenameDocument = async () => {
    if (!renameDocumentId) return;
    try {
      const updated = await api.documents.update(renameDocumentId, {
        title: renameTitle.trim() || "Untitled Document",
      });
      setDocuments((prev) => prev.map((d) => (d.id === renameDocumentId ? { ...d, title: updated.title } : d)));
      setRenameModalOpen(false);
      setRenameDocumentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    router.push("/login");
  };

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (loadEvent) => {
      const avatarUrl = loadEvent.target?.result as string;
      setProfileUploading(true);
      try {
        const storedProfile = typeof window !== "undefined" ? localStorage.getItem("docusphere-user-profile") : null;
        const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};
        const updatedUser = { ...(user || {}), avatarUrl };
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "docusphere-user-profile",
            JSON.stringify({ ...existingProfile, avatarUrl })
          );
        }
        setUser(updatedUser as any);
      } catch (error) {
        console.error("Failed to update profile pic", error);
      } finally {
        setProfileUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const triggerProfileUpload = () => {
    profileInputRef.current?.click();
  };

  // Filtering & sorting
  const filtered = documents
    .filter((d) => {
      if (filterMode === "starred") return d.starred;
      if (filterMode === "shared") return d.shared;
      return true;
    })
    .filter(
      (d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === "name") return a.title.localeCompare(b.title);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
        style={{ 
          backgroundColor: "var(--background)",
          backgroundImage: "url('/background.jpg')" 
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ 
        backgroundColor: "var(--background)",
        backgroundImage: "url('/background.jpg')" 
      }}
    >
      {/* ── Top Bar (Google Docs style) ── */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center h-16 px-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)] hidden sm:block">
              DocuSphere
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--muted)]"
              />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              title={viewMode === "grid" ? "List view" : "Grid view"}
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--background)] flex items-center justify-center text-white font-semibold text-sm shadow-md transition-all"
                title="Open profile"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--background)] border border-[var(--border)]">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-base font-semibold">
                              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)]">{user?.name || "Your profile"}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <button
                        onClick={() => router.push("/profile")}
                        className="w-full rounded-xl px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                      >
                        Profile settings
                      </button>
                      <button
                        onClick={triggerProfileUpload}
                        className="w-full rounded-xl px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-between"
                      >
                        <span>{profileUploading ? "Uploading..." : "Change picture"}</span>
                        <span className="text-xs text-[var(--muted)]">PNG, JPG</span>
                      </button>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => router.push("/admin")}
                          className="w-full rounded-xl px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                          Admin panel
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-all"
                      >
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePhotoChange}
          />
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)] mb-2">Welcome back</p>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] truncate">
              {user ? `Hello, ${user.name || user.email.split("@")[0]}` : "Welcome to DocuSphere"}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
              Manage documents, customize your profile, and continue collaborating with your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              Profile settings
            </button>
            <button
              onClick={handleCreateDocument}
              className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-dark)] transition-all"
            >
              New document
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm mb-6">
          <p className="text-sm font-semibold text-[var(--foreground)]">Welcome to DocuSphere</p>
          <p className="text-xs text-[var(--muted)] mt-1">Create or open a document, then use the editor toolbar to format text, add color, set page layout, and share with your team.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-[12px] text-[var(--foreground)]">
            <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
              <strong>Create:</strong> click + to make a new document and start typing.
            </div>
            <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
              <strong>Organize:</strong> search, sort, and filter documents with the top controls.
            </div>
            <div className="rounded-2xl bg-[var(--background)] p-3 border border-[var(--border)]">
              <strong>Rename:</strong> open the rename modal from the document menu to update titles.
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Filters row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
            {(["all", "owned", "shared", "starred"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterMode(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  filterMode === f
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {f === "all" ? "All Docs" : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Clock className="w-3.5 h-3.5" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-xs font-medium text-[var(--muted)] outline-none cursor-pointer"
              >
                <option value="recent">Recently edited</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Create New Doc ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
            Start a new document
          </h2>
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="w-[160px] h-[200px] rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <span className="text-sm font-medium text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
              Blank document
            </span>
          </button>
        </motion.div>

        {/* ── Document list ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            Recent documents
          </h2>
          <span className="text-xs text-[var(--muted)]">{filtered.length} docs</span>
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileText className="w-16 h-16 text-[var(--border)] mx-auto mb-4" />
            <p className="text-[var(--muted)] text-sm">
              {searchQuery ? "No documents match your search" : "No documents yet. Create one to get started!"}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence>
              {filtered.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[var(--accent)]/30 transition-all"
                  onClick={() => router.push(`/editor/${doc.id}`)}
                >
                  {/* Thumbnail area */}
                  <div className="h-[140px] bg-gradient-to-br from-[var(--background)] to-[var(--surface-hover)] p-4 flex items-start">
                    <div className="text-[2.5rem] leading-none">{doc.emoji}</div>
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] truncate mb-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mb-2">
                      {doc.excerpt || "No preview available"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(doc.updatedAt)}</span>
                      {doc.shared && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">Shared</span>}
                      {!doc.shared && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">Private</span>}
                      {doc.ownerId !== user?.id && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">Collaborator</span>}
                      {doc.starred && <Star className="w-3 h-3 ml-1 text-amber-500 fill-amber-500" />}
                    </div>
                  </div>

                  {/* Context menu trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu(contextMenu === doc.id ? null : doc.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--surface)]/80 backdrop-blur opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-hover)] transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[var(--muted)]" />
                  </button>

                  {/* Context menu */}
                  <AnimatePresence>
                    {contextMenu === doc.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-10 right-2 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 py-1.5"
                      >
                        <button
                          onClick={() => { handleStar(doc.id); setContextMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-2"
                        >
                          {doc.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                          {doc.starred ? "Remove star" : "Add star"}
                        </button>
                        <button
                          onClick={() => handleShare(doc.id)}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                        <button
                          onClick={() => handleRename(doc)}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-2"
                        >
                          <File className="w-3.5 h-3.5" /> Rename
                        </button>
                        <hr className="my-1 border-[var(--border)]" />
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── List View ── */
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_120px_100px_40px] items-center px-4 py-2.5 border-b border-[var(--border)] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              <span className="w-10"></span>
              <span>Name</span>
              <span>Modified</span>
              <span>Status</span>
              <span></span>
            </div>
            <AnimatePresence>
              {filtered.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => router.push(`/editor/${doc.id}`)}
                  className="grid grid-cols-[auto_1fr_120px_100px_40px] items-center px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                >
                  <span className="text-xl w-10">{doc.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--foreground)] truncate">{doc.title}</div>
                    <p className="text-xs text-[var(--muted)] line-clamp-2">{doc.excerpt || "No preview available"}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{formatDate(doc.updatedAt)}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {doc.shared ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold">
                        Shared
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        Private
                      </span>
                    )}
                    {doc.ownerId !== user?.id && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                        Collaborator
                      </span>
                    )}
                    {doc.starred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu(contextMenu === doc.id ? null : doc.id);
                    }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-hover)] transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[var(--muted)]" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[420px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Share document</h3>
                <button
                  onClick={() => setShareModal(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const doc = documents.find((d) => d.id === shareModal);
                if (!doc?.inviteToken) return <p className="text-sm text-[var(--muted)]">Generating share link...</p>;
                const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${doc.inviteToken}`;
                return (
                  <div className="space-y-6">
                    {/* Invite by Email */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">Invite Collaborator</p>
                      <form onSubmit={handleInvite} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                            required
                          />
                          <button
                            type="submit"
                            disabled={inviting}
                            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {inviting ? "Inviting..." : "Invite"}
                          </button>
                        </div>
                        {inviteMessage && (
                          <p className={`text-xs ${inviteMessage.type === "success" ? "text-[var(--success)]" : "text-red-500"}`}>
                            {inviteMessage.text}
                          </p>
                        )}
                      </form>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* Share via Link */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">Share Link</p>
                      <p className="text-xs text-[var(--muted)]">Anyone with this link can edit:</p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={link}
                          className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                        />
                        <button
                          onClick={() => copyShareLink(doc.inviteToken!)}
                          className="px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--background)] transition-all flex items-center gap-1.5"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && setCreateModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="surface w-full max-w-sm overflow-hidden rounded-3xl"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Create document</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">Write a friendly file name before creating.</p>
                  </div>
                  <button onClick={() => setCreateModalOpen(false)} className="w-7 h-7 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] flex items-center justify-center">×</button>
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">File name</label>
                <input
                  className="input-base w-full text-sm"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmCreateDocument(); }}
                  placeholder="Untitled Document"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setCreateModalOpen(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                  <button onClick={confirmCreateDocument} className="btn-primary px-4 py-2 text-sm">Create</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={(e) => e.target === e.currentTarget && setRenameModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="surface w-full max-w-sm overflow-hidden rounded-3xl"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Rename document</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">Give your document a new title.</p>
                  </div>
                  <button onClick={() => setRenameModalOpen(false)} className="w-7 h-7 rounded-lg text-[var(--muted)] hover:bg-[var(--surface-hover)] flex items-center justify-center">×</button>
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Document name</label>
                <input
                  className="input-base w-full text-sm"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmRenameDocument(); }}
                  placeholder="Untitled Document"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setRenameModalOpen(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                  <button onClick={confirmRenameDocument} className="btn-primary px-4 py-2 text-sm">Rename</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss context menus on click outside */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
