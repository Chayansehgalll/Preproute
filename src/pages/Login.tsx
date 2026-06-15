import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId.trim() || !password.trim()) {
      setError("Please enter User ID and Password");
      return;
    }
    setLoading(true);
    try {
      await api.login(userId.trim(), password.trim());
      onLogin();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Illustration Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-24 w-3 h-3 rounded-full bg-indigo-300"></div>
          <div className="absolute top-40 right-40 w-2 h-2 rounded-full bg-amber-400"></div>
          <div className="absolute bottom-32 left-40 w-4 h-4 rounded-full border-2 border-slate-300"></div>
          <div className="absolute bottom-20 right-24 w-3 h-3 rounded-full border-2 border-indigo-200"></div>
        </div>
        <div className="relative">
          <TestTubeIllustration />
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <img
                src="/src/images/preproute_logo.jpeg"
                alt="PrepRoute"
                className="h-24 w-auto object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden font-bold text-slate-800 text-xl">
                Prep<span className="text-indigo-600">Route</span>
              </div>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-slate-800 mb-1">Login</h1>
          <p className="text-sm text-slate-500 mb-8">Use your company provided Login credentials</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="text-right">
              <button type="button" className="text-xs text-indigo-600 hover:underline">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="text-xs text-center text-slate-400">
              Demo credentials: <span className="font-mono text-slate-600">vedant_admin</span> / <span className="font-mono text-slate-600">vedant123</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function TestTubeIllustration() {
  return (
    <svg width="520" height="520" viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="330" x2="470" y2="330" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
      <line x1="80" y1="330" x2="80" y2="460" stroke="#4b5563" strokeWidth="4" />
      <line x1="140" y1="330" x2="140" y2="460" stroke="#4b5563" strokeWidth="4" />
      <line x1="380" y1="330" x2="380" y2="460" stroke="#4b5563" strokeWidth="4" />
      <line x1="440" y1="330" x2="440" y2="460" stroke="#4b5563" strokeWidth="4" />
      <rect x="220" y="140" width="80" height="30" rx="6" fill="#c7d2fe" stroke="#6366f1" strokeWidth="3" />
      <path d="M230 170 L230 300 Q230 320 260 320 Q290 320 290 300 L290 170" fill="none" stroke="#475569" strokeWidth="4" />
      <path d="M232 230 L232 300 Q232 318 260 318 Q288 318 288 300 L288 230 Q260 245 232 230Z" fill="#818cf8" opacity="0.7" />
      <circle cx="248" cy="260" r="4" fill="#1f2937" />
      <circle cx="272" cy="260" r="4" fill="#1f2937" />
      <path d="M248 275 Q260 285 272 275" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M200 310 Q180 310 170 320 L150 330" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="150" cy="330" r="8" fill="#475569" />
      <path d="M200 315 L215 315 Q225 315 225 325 L225 335" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="60" y="260" width="150" height="70" rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="3" />
      <rect x="70" y="270" width="130" height="50" rx="2" fill="#e0e7ff" />
      <line x1="55" y1="332" x2="215" y2="332" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="285" x2="180" y2="285" stroke="#a5b4fc" strokeWidth="2" />
      <line x1="80" y1="295" x2="160" y2="295" stroke="#a5b4fc" strokeWidth="2" />
      <line x1="80" y1="305" x2="170" y2="305" stroke="#a5b4fc" strokeWidth="2" />
      <circle cx="120" cy="180" r="4" stroke="#a5b4fc" strokeWidth="2" />
      <circle cx="380" cy="210" r="3" fill="#fbbf24" />
      <circle cx="420" cy="140" r="2" fill="#1e293b" />
      <circle cx="100" cy="120" r="2" fill="#1e293b" />
      <circle cx="130" cy="220" r="2.5" fill="#1e293b" />
      <path d="M350 200 L360 200 M355 195 L355 205" stroke="#a5b4fc" strokeWidth="2" />
    </svg>
  );
}