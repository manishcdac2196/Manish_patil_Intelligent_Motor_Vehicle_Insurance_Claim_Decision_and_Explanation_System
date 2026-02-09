import React from "react";
import { ShieldAlert, Zap, FileText, BrainCircuit, BarChart3, Lock, Building2, User2 } from "lucide-react";
import { APP_NAME } from "../constants";
import { Button } from "../components/ui/Core";
import { useNavigate } from "react-router-dom";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative font-sans text-slate-900 overflow-x-hidden">
      {/* page background image + subtle gradient to replace plain white */}
      <div
        className="absolute inset-0 -z-50 bg-fixed bg-no-repeat bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.85), rgba(245,247,250,0.9)), url('https://images.unsplash.com/photo-1529257414771-1963f3c9f1a5?auto=format&fit=crop&w=1600&q=60')",
          backgroundSize: "cover",
        }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <ShieldAlert className="fill-current" />
            <span>{APP_NAME}</span>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              variant="primary"
              size="md"
              className="!bg-emerald-600 !text-white rounded-lg px-5 py-2 shadow-sm hover:!bg-emerald-700 flex items-center"
              onClick={() => navigate("/sign-in")}
            >
              <User2 className="mr-2" size={16} />
              Customer Login
            </Button>
            <Button
              variant="primary"
              size="md"
              className="!bg-emerald-600 !text-white rounded-lg px-5 py-2 shadow-sm hover:!bg-emerald-700"
              onClick={() => navigate("/company/sign-in")}
            >
              <Building2 className="mr-2" size={16} />
              Company Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-0 md:left-20 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
          <div className="absolute top-20 right-0 md:right-20 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200/40 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          {/* project-related hero background (policy docs / vehicle imagery) */}
          <div
            className="absolute inset-0 -z-10 opacity-40 animate-slow-pulse"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=1600&q=60')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
            Intelligent Claims. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              Decisions Explained.
            </span>
          </h1>

          {/* hero CTA moved to header; keep a short supporting line here */}
          <p className="text-lg text-slate-900 font-semibold max-w-3xl mx-auto">File claims, get clause-grounded explanations and track decisions with transparency.</p>
        </div>
      </section>

      {/* Project overview removed per request */}

      {/* Login Panels: simplified cards for quick clarity */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg bg-cover bg-center relative"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=60')",
                }}
              >
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <User2 className="text-white" size={22} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-500">For Customers</div>
                <h3 className="text-lg font-bold text-slate-900">File a Claim</h3>
                <p className="text-sm text-slate-600 mt-1">Upload photos, add incident details and receive an AI-assisted estimate quickly.</p>
              </div>
              <div>
                <Button size="lg" className="h-12 px-6 flex items-center gap-2 !bg-emerald-600 !text-white hover:!bg-emerald-700" onClick={() => navigate("/sign-in") }>
                  Customer Login
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                <Building2 className="text-slate-700" size={28} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-500">For Companies</div>
                <h3 className="text-lg font-bold text-slate-900">Review & Manage Claims</h3>
                <p className="text-sm text-slate-600 mt-1">Access claim details, analytics and manage approvals from your company portal.</p>
              </div>
              <div>
                <Button size="lg" className="h-12 px-6 flex items-center gap-2 !bg-emerald-600 !text-white hover:!bg-emerald-700" onClick={() => navigate("/company/sign-in") }>
                  Company Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why choose {APP_NAME}?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Built for modern adjusters and insurers who need speed without sacrificing accuracy or explainability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Instant Damage Analysis"
              description="Upload photos and let our computer vision models identify damage parts and estimate severity in seconds."
              color="bg-amber-50"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6 text-blue-500" />}
              title="RAG Policy Checking"
              description="Automatically cross-reference claims against PDF policy documents to find coverage clauses and exclusions."
              color="bg-blue-50"
            />

            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-emerald-500" />}
              title="Real-time Analytics"
              description="Track claim volume, approval rates, and average processing time on a live dashboard."
              color="bg-emerald-50"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-slate-500" />}
              title="Enterprise Grade"
              description="Secure role-based access control, audit logs, and data encryption standard for all claims."
              color="bg-slate-100"
            />
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-700">
            <ShieldAlert className="fill-slate-400 text-slate-50" />
            <span>{APP_NAME}</span>
          </div>

          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: any) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
    <div className={`mb-4 ${color} w-12 h-12 rounded-xl flex items-center justify-center`}>{icon}</div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
  </div>
);
