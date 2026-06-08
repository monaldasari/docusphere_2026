"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Mail, Lock, User, ArrowRight, Loader2,
  Sparkles, Eye, EyeOff, FileText, Check, ChevronLeft
} from "lucide-react";

type Mode = "login" | "register";

const features = [
  { emoji: "📝", text: "Real-time collaborative editing" },
  { emoji: "🔒", text: "Secure with JWT authentication" },
  { emoji: "📊", text: "Advanced analytics dashboard" },
  { emoji: "🚀", text: "Export to DOCX, PDF, ODT" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await api.auth.login({ email: email.trim(), password });
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        await api.auth.register({ email: email.trim(), password, name: name.trim() });
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0b]">
      {/* Left Panel – Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0f1117 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Background decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DocuSphere</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            The smarter way<br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              to collaborate.
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-12">
            Write, edit, and share documents in real‑time — just like Google Docs, but with more power.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base flex-shrink-0">
                  {f.emoji}
                </div>
                <span className="text-gray-300 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs relative z-10">
          © 2026 DocuSphere. Built for teams that move fast.
        </p>
      </motion.div>

      {/* Right Panel – Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">DocuSphere</span>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl mb-8 bg-white/5 border border-white/10">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: mode === m ? "rgba(99,102,241,0.2)" : "transparent",
                  color: mode === m ? "#a5b4fc" : "#6b7280",
                  border: mode === m ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-1">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                {mode === "login"
                  ? "Sign in to access your documents"
                  : "Start writing and collaborating today"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-400">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        onClick={() => router.push("/forgot-password")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || success}
                  whileHover={{ scale: loading || success ? 1 : 1.01 }}
                  whileTap={{ scale: loading || success ? 1 : 0.99 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all mt-2"
                  style={{
                    background: success
                      ? "rgba(34,197,94,0.8)"
                      : "linear-gradient(135deg, #6366f1, #06b6d4)",
                    opacity: loading ? 0.8 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {success ? (
                    <><Check className="w-4 h-4" /> Redirecting...</>
                  ) : loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "login" ? "Signing in..." : "Creating account..."}</>
                  ) : (
                    <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-gray-600 mt-8">
            By continuing, you agree to our{" "}
            <span className="text-indigo-400 cursor-pointer hover:underline">Terms</span> and{" "}
            <span className="text-indigo-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
