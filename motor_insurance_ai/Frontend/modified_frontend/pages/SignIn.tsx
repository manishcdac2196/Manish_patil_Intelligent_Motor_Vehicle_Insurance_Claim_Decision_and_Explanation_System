import React, { useState } from "react";
import { Card, Button, Input } from "../components/ui/Core";
import { api } from "../services/api";
import { ShieldAlert, User2, Building2 } from "lucide-react";
import { APP_NAME } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

interface AuthProps {
  onLogin: (user: any) => void;
}

export const SignIn: React.FC<AuthProps> = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login } = useAuth();
  const location = useLocation();
  const isCompany = location.pathname.includes("/company");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const role = isCompany ? "company" : "user";
        const { user } = await api.auth.login(email, password, role);
        login(user);
      } else {
        const payload: any = { email, password, name: name || "New User" };
        if (isCompany) {
          payload.role = "company";
          // payload.companyName = ... (SignIn doesn't have company name input in this view)
        }
        const { user } = await api.auth.signup(payload);
        login(user);
      }
    } catch (err: any) {
      alert(`Auth failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-6">
      {/* subtle illustrated background + gradient overlay */}
      <div
        className="absolute inset-0 -z-10 bg-fixed bg-no-repeat bg-center"
        style={{
          backgroundImage: isCompany
            ? "linear-gradient(rgba(6,10,14,0.35), rgba(6,10,14,0.35)), url('https://images.unsplash.com/photo-1542744094-2b8f04d4a0c4?auto=format&fit=crop&w=1600&q=60')"
            : "linear-gradient(rgba(255,255,255,0.6), rgba(250,251,253,0.6)), url('https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1600&q=60')",
          backgroundSize: "cover",
        }}
      />

      {/* decorative SVG accents (subtle) */}
      <svg className="absolute left-6 top-6 -z-10 w-48 h-48 opacity-20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#g1)" />
      </svg>

      <div className="mb-8 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{APP_NAME}</h1>
        <p className="text-slate-900 mt-2 font-semibold text-lg">{isCompany ? "Company Portal" : "Customer Portal"}</p>
        {!isCompany && (
          <div className="mt-3 flex items-center gap-3 justify-center">
            <div className="inline-flex items-center gap-2 mx-auto rounded-full bg-emerald-600 text-white text-sm px-3 py-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
              Customer Login
            </div>
          </div>
        )}
      </div>

      <Card className="w-full max-w-3xl p-0 shadow-2xl border border-transparent bg-white/90 rounded-3xl overflow-hidden backdrop-blur-sm z-10">
        <div className="md:grid md:grid-cols-2">
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-emerald-100">
            {isCompany ? (
              <Building2 size={56} className="text-emerald-600" />
            ) : (
              <User2 size={56} className="text-emerald-600" />
            )}
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{isCompany ? "Company Access" : "Customer Access"}</h3>
            <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">Securely access your claims, documents and personalized dashboard.</p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-semibold mb-6 text-center">{isLogin ? (isCompany ? "Company Sign In" : "Sign In") : "Create Account"}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@example.com"
              />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

              <Button type="submit" className="w-full !bg-emerald-600 !text-white" isLoading={loading}>
                {isLogin ? (isCompany ? "Company Sign In" : "Sign In") : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
              <button className="text-primary-600 font-medium hover:underline" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
              <p className="text-xs text-slate-400">Demo Credentials: Any email works. Use 'error' in email to simulate failure.</p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/"}
                className="text-slate-500 hover:text-slate-700"
              >
                ← Back to Home
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
