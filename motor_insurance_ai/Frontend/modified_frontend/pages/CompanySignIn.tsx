import React, { useState } from "react";
import { Card, Button, Input } from "../components/ui/Core";
import { api } from "../services/api";
import { ShieldAlert, Building2 } from "lucide-react";
import { APP_NAME } from "../constants";
import { useAuth } from "../context/AuthContext";

export const CompanySignIn: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.auth.login(email, password, 'company');
      if (user.role !== 'company') {
        alert("This portal is for Insurance Companies only. Please use the main login.");
        return;
      }
      login(user);
    } catch (err) {
      alert("Auth failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 text-white">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
          <Building2 size={32} />
        </div>
        <h1 className="text-3xl font-bold">{APP_NAME} Enterprise</h1>
        <p className="text-slate-900 mt-2 font-semibold text-lg">Company Login</p>
      </div>

      <Card className="w-full max-w-md p-8 shadow-xl border-slate-700 bg-slate-800">
        <h2 className="text-xl font-semibold mb-2 text-center text-white">Company Sign In</h2>
        <p className="text-sm text-slate-900 text-center mb-6 font-semibold">Access your claims dashboard and customer insights</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@insurance.com"
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 border-none" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">New company? </span>
          <a href="#/company/sign-up" className="text-blue-400 font-medium hover:underline">
            Register your organization
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <p className="text-xs text-slate-500">
            Demo: Use email starting with 'company' (e.g., company@test.com)
          </p>
        </div>
      </Card>

      <div className="mt-8 text-sm text-slate-500">
        <a href="#/sign-in" className="hover:text-white">Looking for User Login?</a>
      </div>
    </div>
  );
};