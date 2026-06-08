"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    api.auth.me().then(user => {
      if (user) setIsLoggedIn(true);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500/30">
      {/* Navbar overlay */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">D</div>
            <span className="font-bold text-lg tracking-tight">DocuSphere</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-white/10 hover:bg-white/20 text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => router.push("/login")} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign In</button>
                <button 
                  onClick={() => router.push("/login")}
                  className="bg-blue-600 hover:bg-blue-500 text-sm font-medium px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
              initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-semibold mb-8"
          >
            <Sparkles size={12} />
            <span>Introducing DocuSphere 2.0</span>
          </motion.div>
          
          <motion.h1
              initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50"
          >
            Design. Write. <br />
            <span className="text-white">Collaborate.</span>
          </motion.h1>

          <motion.p
              initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The minimalist workspace where ideas come to life. Professional tools, 
            cinematic design, and real-time collaboration that feels like magic.
          </motion.p>

          <motion.div
              initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
              className="w-full sm:w-auto bg-white text-black font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all group scale-100 active:scale-95"
            >
              Start Writing Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 font-semibold px-8 py-4 rounded-2xl transition-all"
            >
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Ultra Fast", desc: "Built for speed with modern technology that responds as fast as you think." },
            { icon: Shield, title: "Secure by Design", desc: "Your data is encrypted and stored securely in our state-of-the-art cloud." },
            { icon: Globe, title: "Global Access", desc: "Access your documents from anywhere in the world, on any device." },
          ].map((feature, i) => (
            <motion.div
              key={i}
                initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="text-blue-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-500 text-sm font-medium">© 2026 DocuSphere. All rights reserved.</div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
