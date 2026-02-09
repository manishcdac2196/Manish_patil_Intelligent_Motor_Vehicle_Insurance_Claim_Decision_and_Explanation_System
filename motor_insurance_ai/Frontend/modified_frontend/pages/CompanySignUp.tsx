import React, { useState } from "react";
import { Card, Button, Input } from "../components/ui/Core";
import { api } from "../services/api";
import { ShieldAlert, Building2 } from "lucide-react";
import { APP_NAME } from "../constants";
import { useNavigate } from "react-router-dom";

export const CompanySignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Force company in email for mock logic to work seamlessly
      const finalEmail = email.includes("company") ? email : "company_" + email;
      await api.auth.signup({ email: finalEmail, name, companyName });
      alert("Registration successful! Please sign in.");
      navigate("/company/sign-in");
    } catch {
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-slate-700 bg-slate-800 text-white">
        <div className="text-center mb-6">
          <Building2 className="mx-auto text-blue-500 mb-2" size={32} />
          <h1 className="text-2xl font-bold">{APP_NAME} Enterprise</h1>
          <p className="text-slate-900 text-sm font-semibold">Register your Insurance Organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Organization Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white focus:border-blue-500"
          />
          <Input
            label="Admin Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white focus:border-blue-500"
          />
          <Input
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white focus:border-blue-500"
          />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 border-none" isLoading={loading}>
            Create Company Account
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Already registered? </span>
          <a href="#/company/sign-in" className="text-blue-400 font-medium hover:underline">
            Sign in
          </a>
        </div>
      </Card>
    </div>
  );
};
