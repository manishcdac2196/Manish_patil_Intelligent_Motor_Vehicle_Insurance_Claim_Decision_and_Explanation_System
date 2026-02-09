import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/ui/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ClaimsList } from "./pages/ClaimsList";
import { NewClaimWizard } from "./pages/NewClaimWizard";
import { ClaimDetails } from "./pages/ClaimDetails";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Home } from "./pages/Home";
import { CompanyDashboard } from "./pages/CompanyDashboard";
import { CompanyCustomers } from "./pages/CompanyCustomers";
import { Profile } from "./pages/Profile";
import { CompanyAnalytics } from "./pages/CompanyAnalytics";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Public Auth */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/company/sign-in" element={<SignIn />} />
          <Route path="/company/sign-up" element={<SignUp />} />

          {/* Protected App */}
          <Route
            path="/dashboard/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="claims-list" element={<ClaimsList />} />
            <Route path="claims/new" element={<NewClaimWizard />} />
            <Route path="claims/:claimId" element={<ClaimDetails />} />

            <Route path="company" element={<CompanyDashboard />} />
            <Route path="company/analytics" element={<CompanyAnalytics />} />
            <Route path="company/customers" element={<CompanyCustomers />} />

            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
