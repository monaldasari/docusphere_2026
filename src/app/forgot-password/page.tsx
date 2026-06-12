"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Mail, Lock, ArrowRight, Loader2,
  Sparkles, Check, ChevronLeft, FileText, KeyRound
} from "lucide-react";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      await api.auth.forgotPassword(contact.trim());
      setStep("reset");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      await api.auth.resetPassword({
        contact: contact.trim(),
        otp: otp.trim(),
        newPassword
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please verify the OTP.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0b] items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
      />
      <div className="absolute bottom-[-10%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo and Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (step === "reset") {
                setStep("request");
                setError(null);
              } else {
                router.push("/login");
              }
            }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">DocuSphere</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            {step === "request" ? (
              <motion.div
                key="request-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400 text-sm mb-8">
                  Enter your email address or mobile number, and we'll send you a 4-digit OTP code to verify your identity.
                </p>

                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">Email or Mobile Number</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="name@domain.com or phone"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 py-3 rounded-2xl text-xs text-red-400 flex items-center gap-2 bg-red-500/5 border border-red-500/10"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#6366f1] to-[#06b6d4] hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      <>Send OTP Code <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reset-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                  <KeyRound className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify OTP & Reset</h2>
                <p className="text-gray-400 text-sm mb-8">
                  We've sent a 4-digit code. Check your developer terminal logs or mobile notifications.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">OTP Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none text-center font-mono tracking-widest text-lg focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 py-3 rounded-2xl text-xs text-red-400 flex items-center gap-2 bg-red-500/5 border border-red-500/10"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 py-3 rounded-2xl text-xs text-green-400 flex items-center gap-2 bg-green-500/5 border border-green-500/10"
                    >
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Password reset successfully! Redirecting...
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#6366f1] to-[#06b6d4] hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : success ? (
                      <><Check className="w-4 h-4" /> Redirecting...</>
                    ) : (
                      <>Reset Password <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
