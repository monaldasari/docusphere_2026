"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, User } from "@/lib/api";
import { ArrowLeft, Camera, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.auth.me().then((data) => {
      if (!data) {
        router.push("/login");
        return;
      }

      const savedProfile = typeof window !== "undefined"
        ? localStorage.getItem("docusphere-user-profile")
        : null;
      const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};

      setUser(data);
      setAvatarUrl(parsedProfile.avatarUrl || data.avatarUrl || "");
      setDisplayName(parsedProfile.displayName || data.name || "");
    });
  }, [router]);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!user) return;
    setSaving(true);

    const currentProfile = typeof window !== "undefined"
      ? localStorage.getItem("docusphere-user-profile")
      : null;
    const parsedProfile = currentProfile ? JSON.parse(currentProfile) : {};

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "docusphere-user-profile",
        JSON.stringify({
          ...parsedProfile,
          avatarUrl: avatarUrl || null,
          displayName: displayName.trim() || user.name || user.email.split("@")[0],
        })
      );
    }

    setUser({
      ...user,
      name: displayName.trim() || user.name,
      avatarUrl,
    });
    setSaving(false);
    setMessage("Profile saved locally.");
    window.setTimeout(() => setMessage(""), 2500);
  };

  const handleBack = () => router.push("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
        >
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="w-full lg:w-2/5 rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-bold">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                  >
                    <Camera size={14} /> Change
                  </button>
                </div>

                <div>
                  <p className="text-sm font-semibold">Profile picture</p>
                  <p className="text-xs text-[var(--muted)]">Upload a custom avatar to make your workspace feel personal.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Profile settings</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">Update your avatar and display name for the local DocuSphere experience.</p>

              <div className="mt-6 grid gap-5">
                <label className="space-y-2 text-sm">
                  <span className="block font-medium text-[var(--foreground)]">Display name</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-[var(--accent)]/20 transition-all"
                    placeholder="Enter a name"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="block font-medium text-[var(--foreground)]">Email</span>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--muted)] cursor-not-allowed"
                  />
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-dark)] disabled:opacity-60"
                  >
                    <Check size={16} /> Save profile
                  </button>
                  {message && <span className="text-sm text-[var(--success)]">{message}</span>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
