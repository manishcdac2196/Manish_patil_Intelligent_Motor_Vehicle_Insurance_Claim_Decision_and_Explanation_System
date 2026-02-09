import React, { useState } from "react";
import { Card, Button, Input } from "../components/ui/Core";
import { api } from "../services/api";
import { ShieldAlert, User2, Building2 } from "lucide-react";
import { APP_NAME } from "../constants";
import { useNavigate, useLocation, Link } from "react-router-dom";

interface SignUpProps {
  onLogin: (user: any) => void;
}

export const SignUp: React.FC<SignUpProps> = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isCompany = location.pathname.includes("/company");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { email, name, password };
      if (isCompany) {
        payload.role = "company";
        payload.companyName = companyName;
      }
      const { user } = await api.auth.signup(payload);
      navigate(isCompany ? "/company/sign-in" : "/sign-in");
    } catch (err: any) {
      alert(`Signup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6">
      <div
        className="absolute inset-0 -z-10 bg-fixed bg-no-repeat bg-center"
        style={{
          backgroundImage: isCompany
            ? "linear-gradient(rgba(6,10,14,0.28), rgba(6,10,14,0.28)), url('https://images.unsplash.com/photo-1542744094-2b8f04d4a0c4?auto=format&fit=crop&w=1600&q=60')"
            : "linear-gradient(rgba(255,255,255,0.55), rgba(250,251,253,0.55)), url('https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1600&q=60')",
          backgroundSize: "cover",
        }}
      />

      <svg className="absolute right-6 bottom-6 -z-10 w-56 h-56 opacity-18" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g2" x1="0" x2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="180" height="180" rx="40" fill="url(#g2)" />
      </svg>

      <Card className="w-full max-w-3xl p-0 shadow-2xl border border-transparent bg-white/90 rounded-3xl overflow-hidden backdrop-blur-sm z-10">
        <div className="md:grid md:grid-cols-2">
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-emerald-100">
            {isCompany ? (
              <Building2 size={56} className="text-emerald-600" />
            ) : (
              <User2 size={56} className="text-emerald-600" />
            )}
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{isCompany ? "Create Company Account" : "Create Customer Account"}</h3>
            <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">Quick setup — get access to claims, dashboards and policy details.</p>
          </div>

          <div className="p-8">
            <div className="text-center mb-6">
              <ShieldAlert className="mx-auto text-primary-600 mb-2" size={32} />
              <h1 className="text-2xl font-bold">{APP_NAME}</h1>
              <p className="text-slate-900 text-base font-semibold">{isCompany ? "Create a company account" : "Create your customer account"}</p>
              {/* Company sign-up option intentionally removed for customer flow */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {isCompany && <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />}

              <Button type="submit" className={`w-full !bg-emerald-600 !text-white`} isLoading={loading}>
                Create Account
              </Button>

              <div className="text-center mt-3">
                <Link to={isCompany ? "/company/sign-in" : "/sign-in"} className="text-sm text-emerald-600">
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};
